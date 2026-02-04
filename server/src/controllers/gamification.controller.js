const prisma = require('../utils/prisma');

// Get user's earned badges
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
        course: {
          select: {
            title: true,
            id: true
          }
        }
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: userBadges
    });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_BADGES_ERROR',
        message: 'Failed to fetch badges',
        details: error.message
      }
    });
  }
};

// Get all available badges with unlock status
// Get all available badges with unlock status
exports.getAllBadges = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching badges for user:', userId);

    // Get all badges
    const allBadges = await prisma.badge.findMany({
      orderBy: {
        rarity: 'asc'
      }
    });
    console.log('Found badges:', allBadges.length);

    // Get user's earned badges
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: {
        badgeId: true,
        earnedAt: true
      }
    });
    console.log('Earned badges:', earnedBadges.length);

    const earnedBadgeIds = earnedBadges.map(b => b.badgeId);

    // Get user stats for progress calculation
    console.log('Fetching user stats...');
    const [user, completedLessons, passedQuizzes, completedCourses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalPoints: true,
          currentStreak: true
        }
      }),
      prisma.progress.count({
        where: { userId, completed: true }
      }),
      prisma.quizAttempt.count({
        where: {
          userId,
          passed: true
        }
      }),
      prisma.enrollment.count({
        where: {
          userId,
          progressPercentage: { gte: 100 }
        }
      })
    ]);

    console.log('Stats fetched:', {
      userExists: !!user,
      completedLessons,
      passedQuizzes,
      completedCourses
    });

    if (!user) {
      console.error('User not found for ID:', userId);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found'
        }
      });
    }

    // Map badges with earned status and progress
    const badgesWithStatus = allBadges.map(badge => {
      const earnedInfo = earnedBadges.find(b => b.badgeId === badge.id);
      const isEarned = earnedBadgeIds.includes(badge.id);

      // Calculate progress toward unlock
      let progress = 0;
      let target = 0;
      let details = {};
      try {
        if (badge.criteriaDetails) {
          details = typeof badge.criteriaDetails === 'string'
            ? JSON.parse(badge.criteriaDetails)
            : badge.criteriaDetails;
        }
      } catch (e) {
        console.error(`Error parsing criteriaDetails for badge ${badge.name}:`, e);
      }

      try {
        switch (badge.criteriaType) {
          case 'FIRST_LESSON':
          case 'lesson_completion':
            // Logic for a single lesson or multiple lessons
            target = details.count || 1;
            progress = Math.min(completedLessons, target);
            break;
          case 'FIRST_COURSE':
          case 'course_completion':
            target = details.count || 1;
            progress = Math.min(completedCourses, target);
            break;
          case 'QUIZ_MASTER':
          case 'quiz_completion':
            target = details.count || 5;
            progress = Math.min(passedQuizzes, target);
            break;
          case 'SEVEN_DAY_STREAK':
          case 'streak':
            target = details.days || 7;
            progress = Math.min(user?.currentStreak || 0, target);
            break;
          case 'CENTURY_CLUB':
          case 'points':
            target = details.points || 100;
            progress = Math.min(user?.totalPoints || 0, target);
            break;
          default:
            progress = 0;
            target = 0;
        }
      } catch (err) {
        console.error(`Error calculating progress for badge ${badge.name}:`, err);
        progress = 0;
        target = 0;
      }



      return {
        ...badge,
        isEarned,
        earnedAt: earnedInfo?.earnedAt || null,
        progress,
        target,
        progressPercentage: target > 0 ? Math.round((progress / target) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: badgesWithStatus
    });
  } catch (error) {
    console.error('Get all badges error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_BADGES_ERROR',
        message: 'Failed to fetch badges',
        details: error.message
      }
    });
  }
};

// Get points transaction history
exports.getPointsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, activityType } = req.query;

    const where = { userId };
    if (activityType) {
      where.activityType = activityType;
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.pointsTransaction.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.pointsTransaction.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_POINTS_ERROR',
        message: 'Failed to fetch points history',
        details: error.message
      }
    });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { scope = 'global', courseId, period = 'all-time', limit = 10 } = req.query;
    const userId = req.user.id;

    let users;
    let whereClause = {
      role: 'STUDENT',
      status: 'ACTIVE'
    };

    // Filter by leaderboard visibility (privacy setting)
    // Note: This would require a privacy field in User model or EmailNotificationPreferences
    // For now, we'll show all active students

    if (scope === 'course' && courseId) {
      // Course-specific leaderboard
      const enrolledUserIds = await prisma.enrollment.findMany({
        where: {
          courseId,
          status: 'ACTIVE'
        },
        select: {
          userId: true
        }
      });

      whereClause.id = {
        in: enrolledUserIds.map(e => e.userId)
      };
    }

    // Time-based filtering
    if (period !== 'all-time') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        // For time-based leaderboard, calculate points from transactions
        const transactions = await prisma.pointsTransaction.findMany({
          where: {
            timestamp: {
              gte: startDate
            }
          },
          select: {
            userId: true,
            pointsAmount: true
          }
        });

        // Aggregate points by user
        const userPoints = {};
        transactions.forEach(t => {
          if (!userPoints[t.userId]) {
            userPoints[t.userId] = 0;
          }
          userPoints[t.userId] += t.pointsAmount;
        });

        // Get user details and sort by points
        const userIds = Object.keys(userPoints);
        users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            ...whereClause
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            currentStreak: true
          }
        });

        users = users.map(user => ({
          ...user,
          totalPoints: userPoints[user.id] || 0
        })).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, parseInt(limit));

      } else {
        users = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            totalPoints: true,
            currentStreak: true
          },
          orderBy: {
            totalPoints: 'desc'
          },
          take: parseInt(limit)
        });
      }
    } else {
      // All-time leaderboard
      users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePictureUrl: true,
          totalPoints: true,
          currentStreak: true
        },
        orderBy: {
          totalPoints: 'desc'
        },
        take: parseInt(limit)
      });
    }

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePictureUrl: user.profilePictureUrl,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      isCurrentUser: user.id === userId
    }));

    // Find current user's rank if not in top list
    let currentUserRank = null;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true }
    });

    if (currentUser && !leaderboard.find(u => u.userId === userId)) {
      const usersAbove = await prisma.user.count({
        where: {
          ...whereClause,
          totalPoints: {
            gt: currentUser.totalPoints
          }
        }
      });

      currentUserRank = {
        rank: usersAbove + 1,
        totalPoints: currentUser.totalPoints
      };
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LEADERBOARD_ERROR',
        message: 'Failed to fetch leaderboard',
        details: error.message
      }
    });
  }
};

// Get user streak information
exports.getStreakInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezesAvailable: true,
        streakFreezesUsed: true
      }
    });

    if (!user) {
      // Return default/empty streak info instead of 404 to prevent UI crash
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakFreezesAvailable: 0,
          streakFreezesUsed: 0,
          streakStatus: 'inactive'
        }
      });
    }

    // Check if streak is at risk
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = user.lastActivityDate ? user.lastActivityDate.toISOString().split('T')[0] : null;

    let streakStatus = 'active';
    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity !== yesterdayStr) {
        streakStatus = 'broken';
      } else {
        streakStatus = 'at-risk';
      }
    }

    res.json({
      success: true,
      data: {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActivityDate: user.lastActivityDate,
        streakFreezesAvailable: user.streakFreezesAvailable,
        streakFreezesUsed: user.streakFreezesUsed,
        streakStatus
      }
    });
  } catch (error) {
    console.error('Get streak info error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STREAK_ERROR',
        message: 'Failed to fetch streak information',
        details: error.message
      }
    });
  }
};

// Use streak freeze
exports.useStreakFreeze = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakFreezesAvailable: true,
        streakFreezesUsed: true,
        currentStreak: true,
        lastActivityDate: true
      }
    });

    if (!user) {
      // Return default/empty streak info instead of 404 to prevent UI crash
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          streakFreezesAvailable: 0,
          streakFreezesUsed: 0,
          streakStatus: 'inactive'
        }
      });
    }

    if (user.streakFreezesAvailable <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FREEZES_AVAILABLE',
          message: 'No streak freezes available',
          details: 'You have used all your streak freezes'
        }
      });
    }

    // Check if freeze is needed
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = user.lastActivityDate ? user.lastActivityDate.toISOString().split('T')[0] : null;

    if (lastActivity === today) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FREEZE_NOT_NEEDED',
          message: 'Streak freeze not needed',
          details: 'You already have activity today'
        }
      });
    }

    // Use freeze
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        streakFreezesAvailable: {
          decrement: 1
        },
        streakFreezesUsed: {
          increment: 1
        },
        lastActivityDate: new Date() // Update to preserve streak
      },
      select: {
        currentStreak: true,
        longestStreak: true,
        streakFreezesAvailable: true,
        streakFreezesUsed: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Streak freeze used successfully'
    });
  } catch (error) {
    console.error('Use streak freeze error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USE_FREEZE_ERROR',
        message: 'Failed to use streak freeze',
        details: error.message
      }
    });
  }
};
