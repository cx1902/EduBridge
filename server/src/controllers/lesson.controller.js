const prisma = require('../utils/prisma');

// Get first lesson for a course
exports.getFirstLesson = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lesson = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { sequenceOrder: 'asc' }
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'No lessons found for this course'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Get first lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch first lesson'
    });
  }
};

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
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.courseId
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
    const progress = await prisma.progress.findFirst({
      where: {
        enrollmentId: enrollment.id,
        lessonId: id
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
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId
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
      content,
      type,
      videoUrl,
      videoFileUrl,
      fileUrl,
      fileName,
      fileSize,
      linkUrl,
      difficulty,
      notesContent,
      sequenceOrder,
      estimatedDuration,
      published
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
        content, // Add content
        type, // Add type
        videoUrl, // Keep generic videoUrl (maybe needed for Link type too?)
        videoFileUrl,
        fileUrl,
        fileName,
        fileSize,
        linkUrl,
        difficulty, // Add difficulty
        notesContent,
        sequenceOrder: parseInt(sequenceOrder),
        estimatedDuration: parseInt(estimatedDuration),
        published: true // Default to true or req.body.published? Let's use body if present
      }
    });

    if (req.body.published !== undefined) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { published: req.body.published }
      });
    }

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

// Complete lesson and award XP/Badges
exports.completeLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Verify existence
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // 2. Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId: lesson.courseId }
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // 3. Transaction: Update Progress, Add XP, Check Badges
    const result = await prisma.$transaction(async (tx) => {
      // A. Update/Create Progress
      // "Progress" model has unique([enrollmentId, lessonId])
      // We want to set 'completed = true'

      let progress = await tx.progress.findUnique({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId: id
          }
        }
      });

      let alreadyCompleted = false;
      if (progress) {
        if (progress.completed) alreadyCompleted = true;
        // If not completed, update it
        if (!progress.completed) {
          progress = await tx.progress.update({
            where: { id: progress.id },
            data: { completed: true, completedAt: new Date() }
          });
        }
      } else {
        // Create new progress entry
        progress = await tx.progress.create({
          data: {
            enrollmentId: enrollment.id,
            lessonId: id,
            userId, // Required by schema
            completed: true,
            completedAt: new Date()
          }
        });
      }

      // If already completed, return early (Idempotent)
      if (alreadyCompleted) {
        return {
          xpGained: 0,
          newBadges: [],
          alreadyCompleted: true
        };
      }

      // B. Award XP
      const XP_AMOUNT = 10;
      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: XP_AMOUNT } }
      });

      // Log Transaction
      await tx.pointsTransaction.create({
        data: {
          userId,
          pointsAmount: XP_AMOUNT,
          activityType: 'LESSON_COMPLETION',
          description: `Completed lesson: ${lesson.title}`
        }
      });

      // C. Check Badges
      const newBadges = [];

      // 1. FIRST_STEP (1 Lesson)
      const completedCount = await tx.progress.count({
        where: { userId, completed: true }
      });

      if (completedCount === 1) {
        const badge = await tx.badge.findUnique({ where: { name: 'FIRST_STEP' } });
        if (badge) {
          // Check if already has
          const hasBadge = await tx.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: badge.id } }
          });
          if (!hasBadge) {
            await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
            newBadges.push(badge);
          }
        }
      }

      // 2. CONSISTENT_LEARNER (5 Lessons)
      if (completedCount === 5) {
        const badge = await tx.badge.findUnique({ where: { name: 'CONSISTENT_LEARNER' } });
        if (badge) {
          const hasBadge = await tx.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: badge.id } }
          });
          if (!hasBadge) {
            await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
            newBadges.push(badge);
          }
        }
      }

      // 3. COURSE_FINISHER (All lessons in this course)
      // Count total published lessons in course
      const totalLessons = await tx.lesson.count({
        where: { courseId: lesson.courseId, published: true }
      });

      // Count completed lessons for this course (via progress -> enrollment)
      // enrollment.id is for this course
      const courseCompletedCount = await tx.progress.count({
        where: { enrollmentId: enrollment.id, completed: true }
      });

      if (courseCompletedCount >= totalLessons && totalLessons > 0) {
        const badge = await tx.badge.findUnique({ where: { name: 'COURSE_FINISHER' } });
        if (badge) {
          const hasBadge = await tx.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: badge.id } }
          });
          if (!hasBadge) {
            await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
            newBadges.push(badge);
          }
        }
      }

      return {
        xpGained: XP_AMOUNT,
        newBadges,
        alreadyCompleted: false
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_LESSON_ERROR',
        message: 'Failed to complete lesson',
        details: error.message
      }
    });
  }
};
