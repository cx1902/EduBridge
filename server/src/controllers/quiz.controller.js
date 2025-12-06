const prisma = require('../utils/prisma');

// Get quiz by lesson ID
exports.getQuizByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
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

    // Check enrollment
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
          message: 'You must be enrolled to access quizzes'
        }
      });
    }

    // Get quiz with questions and options
    const quiz = await prisma.quiz.findFirst({
      where: { lessonId },
      include: {
        questions: {
          include: {
            answerOptions: {
              orderBy: {
                sequenceOrder: 'asc'
              },
              select: {
                id: true,
                optionText: true,
                sequenceOrder: true
                // Don't include isCorrect for students
              }
            }
          },
          orderBy: {
            sequenceOrder: 'asc'
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUIZ_NOT_FOUND',
          message: 'No quiz found for this lesson'
        }
      });
    }

    // Get user's attempt count
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId,
        quizId: quiz.id
      }
    });

    // Check if max attempts reached
    if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MAX_ATTEMPTS_REACHED',
          message: `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`
        }
      });
    }

    // Shuffle questions if configured
    if (quiz.shuffleQuestions) {
      quiz.questions = shuffleArray(quiz.questions);
    }

    // Shuffle answer options if configured
    if (quiz.shuffleAnswers) {
      quiz.questions.forEach(question => {
        question.answerOptions = shuffleArray(question.answerOptions);
      });
    }

    res.json({
      success: true,
      data: {
        quiz,
        attemptCount,
        attemptsRemaining: quiz.maxAttempts ? quiz.maxAttempts - attemptCount : null
      }
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_QUIZ_ERROR',
        message: 'Failed to fetch quiz',
        details: error.message
      }
    });
  }
};

// Submit quiz attempt
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of { questionId, selectedOptionIds (array for multi-select), answerText }
    const userId = req.user.userId;

    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            courseId: true
          }
        },
        questions: {
          include: {
            answerOptions: true
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUIZ_NOT_FOUND',
          message: 'Quiz not found'
        }
      });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: quiz.lesson.courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You must be enrolled to take quizzes'
        }
      });
    }

    // Check max attempts
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId,
        quizId
      }
    });

    if (quiz.maxAttempts && attemptCount >= quiz.maxAttempts) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MAX_ATTEMPTS_REACHED',
          message: 'Maximum attempts reached'
        }
      });
    }

    // Grade the quiz
    const gradingResult = gradeQuiz(quiz.questions, answers);
    
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const scorePercentage = (gradingResult.earnedPoints / totalPoints) * 100;
    const passed = scorePercentage >= quiz.passingPercentage;

    const result = await prisma.$transaction(async (tx) => {
      // Create quiz attempt
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId,
          completedAt: new Date(),
          scorePercentage,
          pointsEarned: passed ? gradingResult.earnedPoints : 0,
          passed
        }
      });

      let pointsTransaction = null;
      let badgesEarned = [];

      // Award points if passed
      if (passed) {
        pointsTransaction = await tx.pointsTransaction.create({
          data: {
            userId,
            pointsAmount: gradingResult.earnedPoints,
            activityType: 'QUIZ_PASS',
            referenceId: quizId,
            description: `Passed quiz: ${quiz.title} (${scorePercentage.toFixed(1)}%)`
          }
        });

        // Update user points and streak
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

        if (lastActivity !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastActivity === yesterdayStr) {
            newStreak = user.currentStreak + 1;
          } else if (lastActivity && lastActivity !== yesterdayStr) {
            newStreak = 1;
          } else {
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
              increment: gradingResult.earnedPoints
            },
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: new Date()
          }
        });

        // Check and award badges
        badgesEarned = await checkAndAwardBadges(tx, userId);
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'QUIZ_RESULT',
          title: passed ? 'Quiz Passed!' : 'Quiz Completed',
          message: `You scored ${scorePercentage.toFixed(1)}% on "${quiz.title}"`,
          link: `/lessons/${quiz.lesson.id}`
        }
      });

      return {
        attempt,
        pointsTransaction,
        badgesEarned,
        gradingDetails: gradingResult.details
      };
    });

    // Prepare response with correct answers if immediate feedback is enabled
    let correctAnswers = null;
    if (quiz.immediateFeedback) {
      correctAnswers = quiz.questions.map(q => ({
        questionId: q.id,
        correctOptionIds: q.answerOptions.filter(opt => opt.isCorrect).map(opt => opt.id),
        explanation: q.explanation
      }));
    }

    res.json({
      success: true,
      data: {
        ...result,
        scorePercentage,
        passed,
        totalPoints,
        earnedPoints: gradingResult.earnedPoints,
        correctAnswers: quiz.immediateFeedback ? correctAnswers : null
      },
      message: passed ? 'Congratulations! You passed the quiz' : 'Quiz submitted. Keep practicing!'
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_QUIZ_ERROR',
        message: 'Failed to submit quiz',
        details: error.message
      }
    });
  }
};

// Get quiz attempt history
exports.getAttemptHistory = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.userId;

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    console.error('Get attempt history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HISTORY_ERROR',
        message: 'Failed to fetch attempt history',
        details: error.message
      }
    });
  }
};

// Get all user's quiz attempts
exports.getMyQuizAttempts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingPercentage: true,
            lesson: {
              select: {
                title: true,
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
      skip: parseInt(offset),
      take: parseInt(limit)
    });

    const totalCount = await prisma.quizAttempt.count({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ATTEMPTS_ERROR',
        message: 'Failed to fetch quiz attempts',
        details: error.message
      }
    });
  }
};

// Helper functions

function gradeQuiz(questions, answers) {
  let earnedPoints = 0;
  const details = [];

  questions.forEach(question => {
    const userAnswer = answers.find(a => a.questionId === question.id);
    let isCorrect = false;
    let correctOptionIds = question.answerOptions.filter(opt => opt.isCorrect).map(opt => opt.id);

    if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
      // Single correct answer
      if (userAnswer && userAnswer.selectedOptionIds && userAnswer.selectedOptionIds.length === 1) {
        isCorrect = correctOptionIds.includes(userAnswer.selectedOptionIds[0]);
      }
    } else if (question.questionType === 'MULTIPLE_SELECT') {
      // All correct answers must be selected
      if (userAnswer && userAnswer.selectedOptionIds) {
        const sorted1 = [...userAnswer.selectedOptionIds].sort();
        const sorted2 = [...correctOptionIds].sort();
        isCorrect = JSON.stringify(sorted1) === JSON.stringify(sorted2);
      }
    } else if (question.questionType === 'SHORT_ANSWER') {
      // Exact match for now (could be enhanced with fuzzy matching)
      if (userAnswer && userAnswer.answerText) {
        const correctText = question.answerOptions.find(opt => opt.isCorrect)?.optionText || '';
        isCorrect = userAnswer.answerText.trim().toLowerCase() === correctText.trim().toLowerCase();
      }
    }

    if (isCorrect) {
      earnedPoints += question.points;
    }

    details.push({
      questionId: question.id,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      maxPoints: question.points
    });
  });

  return { earnedPoints, details };
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Check and award badges
async function checkAndAwardBadges(tx, userId) {
  const badgesEarned = [];

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
  const allBadges = await tx.badge.findMany();

  for (const badge of allBadges) {
    if (existingBadgeIds.includes(badge.id)) continue;

    let shouldAward = false;

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
