const prisma = require('../utils/prisma');

// Get lesson by ID with progress
exports.getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            tutorId: true
          }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            passingPercentage: true,
            maxAttempts: true
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Lesson not found',
          details: 'The requested lesson does not exist'
        }
      });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You must be enrolled in this course to access lessons',
          details: 'Please enroll in the course first'
        }
      });
    }

    // Get progress for this lesson
    const progress = await prisma.progress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: id
        }
      }
    });

    // Get all lessons in the course for navigation
    const allLessons = await prisma.lesson.findMany({
      where: {
        courseId: lesson.courseId
      },
      orderBy: {
        sequenceOrder: 'asc'
      },
      select: {
        id: true,
        title: true,
        sequenceOrder: true
      }
    });

    // Determine next and previous lessons
    const currentIndex = allLessons.findIndex(l => l.id === id);
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;

    res.json({
      success: true,
      data: {
        lesson,
        progress: progress || {
          completed: false,
          videoPositionSeconds: 0,
          bookmarked: false,
          notes: null
        },
        navigation: {
          allLessons,
          nextLesson,
          previousLesson,
          currentIndex,
          totalLessons: allLessons.length
        }
      }
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LESSON_ERROR',
        message: 'Failed to fetch lesson',
        details: error.message
      }
    });
  }
};

// Get all lessons for a course
exports.getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        progressRecords: {
          select: {
            lessonId: true,
            completed: true,
            videoPositionSeconds: true,
            bookmarked: true
          }
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You must be enrolled to access course lessons'
        }
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        courseId
      },
      orderBy: {
        sequenceOrder: 'asc'
      },
      include: {
        _count: {
          select: {
            quizzes: true
          }
        }
      }
    });

    // Map progress to lessons
    const lessonsWithProgress = lessons.map(lesson => {
      const progress = enrollment.progressRecords.find(p => p.lessonId === lesson.id);
      return {
        ...lesson,
        progress: progress || {
          completed: false,
          videoPositionSeconds: 0,
          bookmarked: false
        }
      };
    });

    res.json({
      success: true,
      data: {
        lessons: lessonsWithProgress,
        enrollment: {
          id: enrollment.id,
          progressPercentage: enrollment.progressPercentage
        }
      }
    });
  } catch (error) {
    console.error('Get course lessons error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LESSONS_ERROR',
        message: 'Failed to fetch lessons',
        details: error.message
      }
    });
  }
};

// Create lesson (Tutor only)
exports.createLesson = async (req, res) => {
  try {
    const {
      courseId,
      title,
      learningObjectives,
      videoUrl,
      notesContent,
      sequenceOrder,
      estimatedDuration
    } = req.body;

    const tutorId = req.user.userId;

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
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
          message: 'You do not have permission to create lessons for this course'
        }
      });
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        learningObjectives,
        videoUrl,
        notesContent,
        sequenceOrder: parseInt(sequenceOrder),
        estimatedDuration: parseInt(estimatedDuration)
      }
    });

    res.status(201).json({
      success: true,
      data: lesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_LESSON_ERROR',
        message: 'Failed to create lesson',
        details: error.message
      }
    });
  }
};

// Update lesson (Tutor only)
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.userId;

    // Verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: true
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }

    if (lesson.course.tutorId !== tutorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this lesson'
        }
      });
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: updatedLesson,
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_LESSON_ERROR',
        message: 'Failed to update lesson',
        details: error.message
      }
    });
  }
};

// Delete lesson (Tutor only)
exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.userId;

    // Verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: true
      }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LESSON_NOT_FOUND',
          message: 'Lesson not found'
        }
      });
    }

    if (lesson.course.tutorId !== tutorId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this lesson'
        }
      });
    }

    await prisma.lesson.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_LESSON_ERROR',
        message: 'Failed to delete lesson',
        details: error.message
      }
    });
  }
};
