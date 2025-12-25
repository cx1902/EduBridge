const prisma = require('../utils/prisma');

// Helper: parse JSON fields stored as text
function parseJsonField(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeCourse(course) {
  if (!course) return course;
  return {
    ...course,
    learningOutcomes: parseJsonField(course.learningOutcomes),
    tags: parseJsonField(course.tags),
  };
}

// Get all courses with filters
exports.getAllCourses = async (req, res) => {
  try {
    const {
      search,
      subjectCategory,
      educationLevel,
      difficulty,
      pricingModel,
      language,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter conditions using AND to combine search/filters with status visibility
    const andConditions = [];

    if (search) {
      andConditions.push({
        OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (subjectCategory) {
      andConditions.push({ subjectCategory });
    }

    if (educationLevel) {
      andConditions.push({ educationLevel });
    }

    if (difficulty) {
      andConditions.push({ difficulty });
    }

    if (pricingModel) {
      andConditions.push({ pricingModel });
    }

    if (language) {
      andConditions.push({ language });
    }

    // Status visibility: published for everyone; plus own drafts if requested and authenticated
    const statusOr = [{ status: 'PUBLISHED' }];
    if (req.user && req.query.includeOwnDrafts === 'true') {
      statusOr.push({ status: 'DRAFT', tutorId: req.user.id });
    }
    
    // Add debugging log
    console.log('Fetching courses with conditions:', JSON.stringify(andConditions, null, 2));
    
    andConditions.push({ OR: statusOr });

    const where = andConditions.length ? { AND: andConditions } : {};

    // Fetch courses with tutor information
    const [coursesRaw, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          tutor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.course.count({ where })
    ]);

    const courses = coursesRaw.map(normalizeCourse);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_COURSES_ERROR',
        message: 'Failed to fetch courses',
        details: error.message
      }
    });
  }
};

// Get course by ID with details
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const courseRaw = await prisma.course.findUnique({
      where: { id },
      include: {
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            bio: true
          }
        },
        lessons: {
          orderBy: {
            sequenceOrder: 'asc'
          },
          select: {
            id: true,
            title: true,
            sequenceOrder: true,
            estimatedDuration: true,
            _count: {
              select: {
                quizzes: true
              }
            }
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!courseRaw) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found',
          details: 'The requested course does not exist'
        }
      });
    }

    const course = normalizeCourse(courseRaw);

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.id,
            courseId: id
          }
        }
      });
      isEnrolled = !!enrollment;
    }

    res.json({
      success: true,
      data: {
        ...course,
        isEnrolled
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_COURSE_ERROR',
        message: 'Failed to fetch course details',
        details: error.message
      }
    });
  }
};

// Enroll in course
exports.enrollInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.userId;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found',
          details: 'The requested course does not exist'
        }
      });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COURSE_NOT_AVAILABLE',
          message: 'Course is not available for enrollment',
          details: 'This course is not currently published'
        }
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ENROLLMENT_EXISTS',
          message: 'Already enrolled in this course',
          details: 'You are already enrolled in this course'
        }
      });
    }

    // For paid courses, check if payment is processed (simplified for now)
    if (course.pricingModel !== 'FREE') {
      // TODO: Integrate payment verification
      // For now, we'll allow enrollment but in production this should verify payment
    }

    // Create enrollment and progress records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
          progressPercentage: 0
        }
      });

      // Create progress records for all lessons
      const progressRecords = await Promise.all(
        course.lessons.map(lesson =>
          tx.progress.create({
            data: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
              userId,
              completed: false,
              videoPositionSeconds: 0
            }
          })
        )
      );

      // Update course enrollment count
      await tx.course.update({
        where: { id: courseId },
        data: {
          enrollmentCount: {
            increment: 1
          }
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'ENROLLMENT',
          title: 'Successfully Enrolled',
          message: `You have successfully enrolled in ${course.title}`,
          link: `/courses/${courseId}/lessons`
        }
      });

      return { enrollment, progressRecords };
    });

    res.status(201).json({
      success: true,
      data: result.enrollment,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENROLLMENT_ERROR',
        message: 'Failed to enroll in course',
        details: error.message
      }
    });
  }
};

// Create course (Tutor only)
exports.createCourse = async (req, res) => {
  try {
    const tutorId = req.user.userId;
    const {
      title,
      description,
      subjectCategory,
      educationLevel,
      difficulty,
      prerequisites,
      thumbnailUrl,
      price,
      pricingModel,
      estimatedHours,
      language
    } = req.body;

    const course = await prisma.course.create({
      data: {
        tutorId,
        title,
        description,
        subjectCategory,
        educationLevel,
        difficulty,
        prerequisites,
        thumbnailUrl,
        price: parseFloat(price) || 0,
        pricingModel: pricingModel || 'FREE',
        estimatedHours: parseInt(estimatedHours),
        language: language || 'en',
        status: 'DRAFT'
      }
    });

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_COURSE_ERROR',
        message: 'Failed to create course',
        details: error.message
      }
    });
  }
};

// Update course (Tutor only)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.userId;

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.tutorId !== tutorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this course'
        }
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_COURSE_ERROR',
        message: 'Failed to update course',
        details: error.message
      }
    });
  }
};

// Delete course (Tutor/Admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.userId;

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.tutorId !== tutorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this course'
        }
      });
    }

    await prisma.course.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_COURSE_ERROR',
        message: 'Failed to delete course',
        details: error.message
      }
    });
  }
};

// Get course enrollments (for tutors)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.id;

    // Verify course belongs to tutor
    const course = await prisma.course.findUnique({
      where: { id },
      select: { tutorId: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found'
        }
      });
    }

    if (course.tutorId !== tutorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to view these enrollments'
        }
      });
    }

    // Get enrollments with student info
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: id,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ENROLLMENTS_ERROR',
        message: 'Failed to fetch course enrollments',
        details: error.message
      }
    });
  }
};
