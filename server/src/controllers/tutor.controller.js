const prisma = require('../utils/prisma');
const path = require('path');

// Get tutor dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const tutorId = req.user.id;

    // Get total students enrolled in tutor's courses
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        course: {
          tutorId,
        },
        status: 'ACTIVE',
      },
    });

    // Get published courses count
    const publishedCoursesCount = await prisma.course.count({
      where: {
        tutorId,
        status: 'PUBLISHED',
      },
    });

    // Get upcoming sessions count
    const upcomingSessionsCount = await prisma.tutoringSession.count({
      where: {
        tutorId,
        scheduledStart: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
    });

    // Get average course rating
    const courses = await prisma.course.findMany({
      where: { tutorId },
      select: {
        averageRating: true,
      },
    });

    const totalRating = courses.reduce(
      (sum, course) => sum + (course.averageRating ? parseFloat(course.averageRating) : 0),
      0
    );
    const averageRating = courses.length > 0 ? totalRating / courses.length : 0;

    res.json({
      totalStudents: enrollmentCount,
      publishedCourses: publishedCoursesCount,
      upcomingSessions: upcomingSessionsCount,
      averageRating: averageRating.toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get today's scheduled sessions
const getTodaysSessions = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.tutoringSession.findMany({
      where: {
        tutorId,
        scheduledStart: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        bookings: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching today\'s sessions:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s sessions' });
  }
};

// Get recent enrollments
const getRecentEnrollments = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          tutorId,
        },
        enrolledAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
      take: 10,
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments' });
  }
};

// Get tutor notifications
const getTutorNotifications = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: tutorId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// ==================== COURSE MANAGEMENT ====================

// Create new course
const createCourse = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const {
      title,
      description,
      subjectCategory,
      educationLevel,
      difficulty,
      prerequisites,
      price,
      pricingModel,
      estimatedHours,
      language,
      thumbnailUrl,
    } = req.body;

    // Validation
    if (!title || title.length < 5 || title.length > 200) {
      return res.status(400).json({ error: 'Title must be between 5-200 characters' });
    }

    if (!description || description.length < 50) {
      return res.status(400).json({ error: 'Description must be at least 50 characters' });
    }

    if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    if (!subjectCategory || !educationLevel) {
      return res.status(400).json({ error: 'Subject category and education level are required' });
    }

    // Check for duplicate title by same tutor
    const existingCourse = await prisma.course.findFirst({
      where: {
        tutorId,
        title,
      },
    });

    if (existingCourse) {
      return res.status(400).json({
        error: 'You already have a course with this title. Please choose a unique title.',
      });
    }

    const course = await prisma.course.create({
      data: {
        tutorId,
        title,
        description,
        subjectCategory,
        educationLevel,
        difficulty,
        prerequisites: prerequisites || null,
        price: price || 0,
        pricingModel: pricingModel || 'FREE',
        estimatedHours: estimatedHours || 0,
        language: language || 'en',
        thumbnailUrl: thumbnailUrl || '/uploads/default-course.png',
        status: 'DRAFT',
      },
      include: {
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Course created successfully. Add lessons to get started.',
      course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Get all courses by tutor
const getTutorCourses = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const courses = await prisma.course.findMany({
      where: {
        tutorId,
      },
      include: {
        _count: {
          select: {
            lessons: true,
            quizzes: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching tutor courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get course details by ID (tutor-owned)
const getTutorCourseDetails = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: {
        id,
        tutorId,
      },
      include: {
        lessons: {
          orderBy: {
            sequenceOrder: 'asc',
          },
          include: {
            _count: {
              select: {
                quizzes: true,
              },
            },
          },
        },
        quizzes: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
        enrollments: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
            quizzes: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const course = await prisma.course.findFirst({
      where: {
        id,
        tutorId,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Validation
    if (updateData.title && (updateData.title.length < 5 || updateData.title.length > 200)) {
      return res.status(400).json({ error: 'Title must be between 5-200 characters' });
    }

    if (updateData.description && updateData.description.length < 50) {
      return res.status(400).json({ error: 'Description must be at least 50 characters' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            lessons: true,
            quizzes: true,
            enrollments: true,
          },
        },
      },
    });

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const course = await prisma.course.findFirst({
      where: {
        id,
        tutorId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Check for active enrollments
    if (course._count.enrollments > 0) {
      return res.status(400).json({
        error: `This course has ${course._count.enrollments} enrolled students. Are you sure you want to delete it? Students will lose access.`,
        hasEnrollments: true,
        enrollmentCount: course._count.enrollments,
      });
    }

    await prisma.course.delete({
      where: { id },
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// Toggle publish status
const togglePublishCourse = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const course = await prisma.course.findFirst({
      where: {
        id,
        tutorId,
      },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Validation for publishing
    if (course.status !== 'PUBLISHED') {
      // Attempting to publish
      if (course._count.lessons === 0) {
        return res.status(400).json({
          error: 'Cannot publish course. Please add at least one lesson first.',
          requirements: ['At least one lesson'],
        });
      }

      if (!course.title || !course.description || !course.subjectCategory) {
        return res.status(400).json({
          error: 'Cannot publish course. All required metadata must be filled.',
          requirements: ['Title', 'Description', 'Subject Category', 'Level'],
        });
      }
    }

    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const publishedAt = newStatus === 'PUBLISHED' ? new Date() : course.publishedAt;

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: newStatus,
        publishedAt,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: tutorId,
        type: newStatus === 'PUBLISHED' ? 'COURSE_APPROVED' : 'SYSTEM_ANNOUNCEMENT',
        title: newStatus === 'PUBLISHED' ? 'Course Published' : 'Course Unpublished',
        message:
          newStatus === 'PUBLISHED'
            ? `Your course "${course.title}" has been published successfully.`
            : `Your course "${course.title}" has been unpublished.`,
      },
    });

    res.json({
      message:
        newStatus === 'PUBLISHED'
          ? 'Course published successfully'
          : 'Course unpublished successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({ error: 'Failed to update course status' });
  }
};

// ==================== LESSON MANAGEMENT ====================

// Create new lesson
const createLesson = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { courseId } = req.params;
    const {
      title,
      content,
      learningObjectives,
      videoUrl,
      videoFileUrl,
      notesContent,
      attachments,
      estimatedDuration,
      published,
    } = req.body;

    // Check course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tutorId,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Validation
    if (!title || title.length < 5 || title.length > 150) {
      return res.status(400).json({ error: 'Title must be between 5-150 characters' });
    }

    if (content && content.length < 20) {
      return res.status(400).json({ error: 'Content must be at least 20 characters' });
    }

    // Get next sequence order
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { sequenceOrder: 'desc' },
    });

    const sequenceOrder = lastLesson ? lastLesson.sequenceOrder + 1 : 1;

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content: content || '',
        learningObjectives: learningObjectives || '',
        videoUrl: videoUrl || null,
        videoFileUrl: videoFileUrl || null,
        notesContent: notesContent || null,
        attachments: attachments || [],
        estimatedDuration: estimatedDuration || 30,
        sequenceOrder,
        published: published !== undefined ? published : true,
      },
    });

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson,
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
};

// Get all lessons for a course
const getLessons = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { courseId } = req.params;

    // Check course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tutorId,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
      orderBy: {
        sequenceOrder: 'asc',
      },
    });

    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};

// Get lesson details
const getLessonDetails = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            tutorId: true,
            title: true,
          },
        },
        quizzes: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check ownership
    if (lesson.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    res.status(500).json({ error: 'Failed to fetch lesson details' });
  }
};

// Update lesson
const updateLesson = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (lesson.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validation
    if (updateData.title && (updateData.title.length < 5 || updateData.title.length > 150)) {
      return res.status(400).json({ error: 'Title must be between 5-150 characters' });
    }

    if (updateData.content && updateData.content.length < 20) {
      return res.status(400).json({ error: 'Content must be at least 20 characters' });
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Lesson updated successfully',
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
};

// Delete lesson
const deleteLesson = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (lesson.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.lesson.delete({
      where: { id },
    });

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
};

// Reorder lessons
const reorderLessons = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { lessonOrders } = req.body; // Array of { id, sequenceOrder }

    if (!Array.isArray(lessonOrders)) {
      return res.status(400).json({ error: 'lessonOrders must be an array' });
    }

    // Verify all lessons belong to tutor
    const lessonIds = lessonOrders.map((l) => l.id);
    const lessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
      },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    const unauthorized = lessons.some((lesson) => lesson.course.tutorId !== tutorId);
    if (unauthorized) {
      return res.status(403).json({ error: 'Access denied to one or more lessons' });
    }

    // Update sequence orders
    const updatePromises = lessonOrders.map((item) =>
      prisma.lesson.update({
        where: { id: item.id },
        data: { sequenceOrder: item.sequenceOrder },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Lessons reordered successfully' });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    res.status(500).json({ error: 'Failed to reorder lessons' });
  }
};

// ==================== QUIZ MANAGEMENT ====================

// Create quiz
const createQuiz = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { courseId } = req.params;
    const {
      lessonId,
      title,
      instructions,
      timeLimitMinutes,
      passingPercentage,
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      immediateFeedback,
      showCorrectAnswers,
    } = req.body;

    // Check course ownership
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        tutorId,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Validation
    if (!title || title.length < 5 || title.length > 100) {
      return res.status(400).json({ error: 'Title must be between 5-100 characters' });
    }

    if (passingPercentage && (passingPercentage < 0 || passingPercentage > 100)) {
      return res.status(400).json({ error: 'Passing percentage must be between 0-100' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        lessonId: lessonId || null,
        title,
        instructions: instructions || null,
        timeLimitMinutes: timeLimitMinutes || null,
        passingPercentage: passingPercentage || 70,
        maxAttempts: maxAttempts || null,
        shuffleQuestions: shuffleQuestions || false,
        shuffleAnswers: shuffleAnswers || false,
        immediateFeedback: immediateFeedback !== undefined ? immediateFeedback : true,
        showCorrectAnswers: showCorrectAnswers !== undefined ? showCorrectAnswers : true,
      },
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz,
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
};

// Get quiz details
const getQuizDetails = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            tutorId: true,
            title: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: {
          include: {
            answerOptions: {
              orderBy: {
                sequenceOrder: 'asc',
              },
            },
          },
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check ownership
    if (quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    res.status(500).json({ error: 'Failed to fetch quiz details' });
  }
};

// Update quiz
const updateQuiz = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validation
    if (updateData.title && (updateData.title.length < 5 || updateData.title.length > 100)) {
      return res.status(400).json({ error: 'Title must be between 5-100 characters' });
    }

    if (
      updateData.passingPercentage &&
      (updateData.passingPercentage < 0 || updateData.passingPercentage > 100)
    ) {
      return res.status(400).json({ error: 'Passing percentage must be between 0-100' });
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Quiz updated successfully',
      quiz: updatedQuiz,
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.quiz.delete({
      where: { id },
    });

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
};

// ==================== QUESTION MANAGEMENT ====================

// Add question to quiz
const addQuestion = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { quizId } = req.params;
    const {
      questionType,
      questionText,
      questionImageUrl,
      points,
      explanation,
      answerOptions,
    } = req.body;

    // Check quiz ownership
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          select: {
            tutorId: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validation
    if (!questionText || questionText.length < 10) {
      return res.status(400).json({ error: 'Question text must be at least 10 characters' });
    }

    if (!['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(questionType)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    // Additional validation for MCQ
    if (questionType === 'MULTIPLE_CHOICE') {
      if (!answerOptions || !Array.isArray(answerOptions) || answerOptions.length < 2) {
        return res
          .status(400)
          .json({ error: 'Multiple choice questions must have at least 2 options' });
      }

      const correctOptions = answerOptions.filter((opt) => opt.isCorrect);
      if (correctOptions.length !== 1) {
        return res
          .status(400)
          .json({ error: 'Multiple choice questions must have exactly one correct answer' });
      }
    }

    // Get next sequence order
    const lastQuestion = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { sequenceOrder: 'desc' },
    });

    const sequenceOrder = lastQuestion ? lastQuestion.sequenceOrder + 1 : 1;

    // Create question with answer options
    const question = await prisma.question.create({
      data: {
        quizId,
        questionType,
        questionText,
        questionImageUrl: questionImageUrl || null,
        points: points || 10,
        explanation: explanation || null,
        sequenceOrder,
        answerOptions: {
          create: answerOptions
            ? answerOptions.map((option, index) => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect || false,
                sequenceOrder: index + 1,
              }))
            : [],
        },
      },
      include: {
        answerOptions: {
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      message: 'Question added successfully',
      question,
    });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const { questionText, questionImageUrl, points, explanation, answerOptions } = req.body;

    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update question
    const updateData = {};
    if (questionText) updateData.questionText = questionText;
    if (questionImageUrl !== undefined) updateData.questionImageUrl = questionImageUrl;
    if (points) updateData.points = points;
    if (explanation !== undefined) updateData.explanation = explanation;

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    // Update answer options if provided
    if (answerOptions && Array.isArray(answerOptions)) {
      // Delete existing options
      await prisma.answerOption.deleteMany({
        where: { questionId: id },
      });

      // Create new options
      await prisma.answerOption.createMany({
        data: answerOptions.map((option, index) => ({
          questionId: id,
          optionText: option.optionText,
          isCorrect: option.isCorrect || false,
          sequenceOrder: index + 1,
        })),
      });
    }

    // Fetch updated question with options
    const finalQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        answerOptions: {
          orderBy: {
            sequenceOrder: 'asc',
          },
        },
      },
    });

    res.json({
      message: 'Question updated successfully',
      question: finalQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;

    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.quiz.course.tutorId !== tutorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.question.delete({
      where: { id },
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// Reorder questions
const reorderQuestions = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const { questionOrders } = req.body; // Array of { id, sequenceOrder }

    if (!Array.isArray(questionOrders)) {
      return res.status(400).json({ error: 'questionOrders must be an array' });
    }

    // Verify all questions belong to tutor
    const questionIds = questionOrders.map((q) => q.id);
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        quiz: {
          include: {
            course: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    const unauthorized = questions.some((q) => q.quiz.course.tutorId !== tutorId);
    if (unauthorized) {
      return res.status(403).json({ error: 'Access denied to one or more questions' });
    }

    // Update sequence orders
    const updatePromises = questionOrders.map((item) =>
      prisma.question.update({
        where: { id: item.id },
        data: { sequenceOrder: item.sequenceOrder },
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ error: 'Failed to reorder questions' });
  }
};

module.exports = {
  getDashboardStats,
  getTodaysSessions,
  getRecentEnrollments,
  getTutorNotifications,
  // Course management
  createCourse,
  getTutorCourses,
  getTutorCourseDetails,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  // Lesson management
  createLesson,
  getLessons,
  getLessonDetails,
  updateLesson,
  deleteLesson,
  reorderLessons,
  // Quiz management
  createQuiz,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  // Question management
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
};
