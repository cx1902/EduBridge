const prisma = require('../utils/prisma');

// Update video position for a lesson
exports.updateVideoPosition = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const { videoPositionSeconds } = req.body;
    const userId = req.user.userId;

    // Get enrollment for this lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true, estimatedDuration: true }
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
          message: 'You must be enrolled to track progress'
        }
      });
    }

    // Update or create progress record
    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId
        }
      },
      update: {
        videoPositionSeconds: parseInt(videoPositionSeconds),
        lastAccessedAt: new Date()
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId,
        videoPositionSeconds: parseInt(videoPositionSeconds),
        completed: false,
        lastAccessedAt: new Date()
      }
    });

    // Update enrollment last accessed
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        lastAccessedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Update video position error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_POSITION_ERROR',
        message: 'Failed to update video position',
        details: error.message
      }
    });
  }
};

// Mark lesson as complete
exports.markLessonComplete = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.userId;

    // Get lesson and course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId
        }
      },
      include: {
        progressRecords: true
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You must be enrolled to mark lessons complete'
        }
      });
    }

    // Check if already completed to avoid duplicate points
    const existingProgress = enrollment.progressRecords.find(p => p.lessonId === lessonId);
    const alreadyCompleted = existingProgress?.completed || false;

    const result = await prisma.$transaction(async (tx) => {
      // Update progress
      const progress = await tx.progress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId
          }
        },
        update: {
          completed: true,
          completedAt: new Date(),
          lastAccessedAt: new Date()
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId,
          userId,
          completed: true,
          completedAt: new Date(),
          videoPositionSeconds: 0
        }
      });

      // Calculate new progress percentage
      const allProgress = await tx.progress.findMany({
        where: {
          enrollmentId: enrollment.id
        }
      });

      const completedCount = allProgress.filter(p => p.completed).length;
      const totalLessons = allProgress.length;
      const progressPercentage = (completedCount / totalLessons) * 100;

      // Update enrollment
      const updatedEnrollment = await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercentage,
          lastAccessedAt: new Date(),
          completedAt: progressPercentage >= 100 ? new Date() : null
        }
      });

      let pointsTransaction = null;
      let badgesEarned = [];

      // Award points only if not already completed
      if (!alreadyCompleted) {
        const lessonPoints = 10; // Configurable points per lesson

        // Create points transaction
        pointsTransaction = await tx.pointsTransaction.create({
          data: {
            userId,
            pointsAmount: lessonPoints,
            activityType: 'LESSON_COMPLETION',
            referenceId: lessonId,
            description: `Completed lesson: ${lesson.title}`
          }
        });

        // Update user total points and streak
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            totalPoints: true,
            currentStreak: true,
            longestStreak: true,
            lastActivityDate: true
          }
        });

        const today = new Date().toISOString().split('T')[0];
        const lastActivity = user.lastActivityDate ? user.lastActivityDate.toISOString().split('T')[0] : null;
        
        let newStreak = user.currentStreak;
        let newLongestStreak = user.longestStreak;

        // Update streak logic
        if (lastActivity !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastActivity === yesterdayStr) {
            // Consecutive day - increment streak
            newStreak = user.currentStreak + 1;
          } else if (lastActivity && lastActivity !== yesterdayStr) {
            // Streak broken - reset to 1
            newStreak = 1;
          } else {
            // First activity or no last activity
            newStreak = 1;
          }

          if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
          }
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            totalPoints: {
              increment: lessonPoints
            },
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: new Date()
          }
        });

        // Check and award badges
        badgesEarned = await checkAndAwardBadges(tx, userId);
      }

      return {
        progress,
        enrollment: updatedEnrollment,
        pointsTransaction,
        badgesEarned
      };
    });

    res.json({
      success: true,
      data: result,
      message: alreadyCompleted ? 'Lesson already completed' : 'Lesson completed successfully'
    });
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETE_LESSON_ERROR',
        message: 'Failed to mark lesson as complete',
        details: error.message
      }
    });
  }
};

// Get student progress summary
exports.getMyProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [user, enrollments, quizAttempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalPoints: true,
          currentStreak: true,
          longestStreak: true
        }
      }),
      prisma.enrollment.findMany({
        where: {
          userId,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              _count: {
                select: {
                  lessons: true
                }
              }
            }
          },
          progressRecords: {
            where: {
              completed: true
            }
          }
        },
        orderBy: {
          lastAccessedAt: 'desc'
        }
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              passingPercentage: true,
              lesson: {
                select: {
                  course: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 10
      })
    ]);

    // Calculate statistics
    const totalCoursesEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => parseFloat(e.progressPercentage) >= 100).length;
    const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + e.progressRecords.length, 0);
    const totalQuizzesPassed = quizAttempts.filter(a => a.passed).length;

    // Format enrollments with progress info
    const enrollmentsWithProgress = enrollments.map(e => ({
      id: e.id,
      courseId: e.course.id,
      courseTitle: e.course.title,
      courseThumbnail: e.course.thumbnailUrl,
      progressPercentage: parseFloat(e.progressPercentage),
      lastAccessedAt: e.lastAccessedAt,
      completedLessons: e.progressRecords.length,
      totalLessons: e.course._count.lessons
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalPoints: user.totalPoints,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          totalCoursesEnrolled,
          completedCourses,
          totalLessonsCompleted,
          totalQuizzesPassed
        },
        enrollments: enrollmentsWithProgress,
        recentQuizAttempts: quizAttempts
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROGRESS_ERROR',
        message: 'Failed to fetch progress',
        details: error.message
      }
    });
  }
};

// Save lesson notes
exports.saveLessonNotes = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true }
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
          message: 'You must be enrolled to save notes'
        }
      });
    }

    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId
        }
      },
      update: {
        notes
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId,
        notes,
        completed: false,
        videoPositionSeconds: 0
      }
    });

    res.json({
      success: true,
      data: progress,
      message: 'Notes saved successfully'
    });
  } catch (error) {
    console.error('Save notes error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_NOTES_ERROR',
        message: 'Failed to save notes',
        details: error.message
      }
    });
  }
};

// Toggle lesson bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true }
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
          message: 'You must be enrolled to bookmark lessons'
        }
      });
    }

    // Get current progress
    const currentProgress = await prisma.progress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId
        }
      }
    });

    const newBookmarkStatus = !currentProgress?.bookmarked;

    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId
        }
      },
      update: {
        bookmarked: newBookmarkStatus
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId,
        bookmarked: newBookmarkStatus,
        completed: false,
        videoPositionSeconds: 0
      }
    });

    res.json({
      success: true,
      data: {
        bookmarked: progress.bookmarked
      },
      message: progress.bookmarked ? 'Lesson bookmarked' : 'Bookmark removed'
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_BOOKMARK_ERROR',
        message: 'Failed to toggle bookmark',
        details: error.message
      }
    });
  }
};

// Helper function to check and award badges
async function checkAndAwardBadges(tx, userId) {
  const badgesEarned = [];

  // Get user data for badge checks
  const [user, completedLessons, passedQuizzes, enrollments, existingBadges] = await Promise.all([
    tx.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true, currentStreak: true }
    }),
    tx.progress.count({
      where: { userId, completed: true }
    }),
    tx.quizAttempt.count({
      where: {
        userId,
        passed: true,
        scorePercentage: { gte: 80 }
      }
    }),
    tx.enrollment.count({
      where: {
        userId,
        progressPercentage: { gte: 100 }
      }
    }),
    tx.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    })
  ]);

  const existingBadgeIds = existingBadges.map(b => b.badgeId);

  // Get all badges with criteria
  const allBadges = await tx.badge.findMany();

  for (const badge of allBadges) {
    // Skip if already earned
    if (existingBadgeIds.includes(badge.id)) continue;

    let shouldAward = false;

    // Check criteria based on badge type
    switch (badge.criteriaType) {
      case 'FIRST_LESSON':
        shouldAward = completedLessons >= 1;
        break;
      case 'FIRST_COURSE':
        shouldAward = enrollments >= 1;
        break;
      case 'QUIZ_MASTER':
        shouldAward = passedQuizzes >= 5;
        break;
      case 'SEVEN_DAY_STREAK':
        shouldAward = user.currentStreak >= 7;
        break;
      case 'CENTURY_CLUB':
        shouldAward = user.totalPoints >= 100;
        break;
    }

    if (shouldAward) {
      const userBadge = await tx.userBadge.create({
        data: {
          userId,
          badgeId: badge.id
        },
        include: {
          badge: true
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'BADGE_EARNED',
          title: 'Badge Earned!',
          message: `Congratulations! You've earned the "${badge.name}" badge`,
          link: '/student/progress'
        }
      });

      badgesEarned.push(userBadge);
    }
  }

  return badgesEarned;
}
