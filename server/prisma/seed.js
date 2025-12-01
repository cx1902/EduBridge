const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.courseReview.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.sessionBooking.deleteMany();
    await prisma.tutoringSession.deleteMany();
    await prisma.pointsTransaction.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.progress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.answerOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create default admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@educonnect.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample tutor
  const tutorPassword = await bcrypt.hash('Tutor@123', 10);
  const tutor = await prisma.user.create({
    data: {
      email: 'tutor@educonnect.com',
      passwordHash: tutorPassword,
      role: 'TUTOR',
      firstName: 'John',
      lastName: 'Smith',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created tutor user:', tutor.email);

  // Create sample student
  const studentPassword = await bcrypt.hash('Student@123', 10);
  const student = await prisma.user.create({
    data: {
      email: 'student@educonnect.com',
      passwordHash: studentPassword,
      role: 'STUDENT',
      firstName: 'Jane',
      lastName: 'Doe',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created student user:', student.email);

  // Create badges
  const badges = [
    {
      name: 'First Steps',
      description: 'Complete your first lesson',
      iconUrl: '/badges/first-steps.png',
      criteriaType: 'lesson_completion',
      criteriaDetails: JSON.stringify({ count: 1 }),
      rarity: 'COMMON',
    },
    {
      name: 'Quiz Master',
      description: 'Pass your first quiz',
      iconUrl: '/badges/quiz-master.png',
      criteriaType: 'quiz_pass',
      criteriaDetails: JSON.stringify({ count: 1 }),
      rarity: 'COMMON',
    },
    {
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      iconUrl: '/badges/week-warrior.png',
      criteriaType: 'streak',
      criteriaDetails: JSON.stringify({ days: 7 }),
      rarity: 'RARE',
    },
    {
      name: 'Month Master',
      description: 'Maintain a 30-day learning streak',
      iconUrl: '/badges/month-master.png',
      criteriaType: 'streak',
      criteriaDetails: JSON.stringify({ days: 30 }),
      rarity: 'EPIC',
    },
    {
      name: 'Course Conqueror',
      description: 'Complete your first course',
      iconUrl: '/badges/course-conqueror.png',
      criteriaType: 'course_completion',
      criteriaDetails: JSON.stringify({ count: 1 }),
      rarity: 'RARE',
    },
    {
      name: 'Perfect Score',
      description: 'Achieve 100% on a quiz',
      iconUrl: '/badges/perfect-score.png',
      criteriaType: 'quiz_perfect',
      criteriaDetails: JSON.stringify({ score: 100 }),
      rarity: 'EPIC',
    },
    {
      name: 'Live Learner',
      description: 'Attend 10 live tutoring sessions',
      iconUrl: '/badges/live-learner.png',
      criteriaType: 'session_attendance',
      criteriaDetails: JSON.stringify({ count: 10 }),
      rarity: 'RARE',
    },
    {
      name: 'Knowledge Seeker',
      description: 'Accumulate 1000 points',
      iconUrl: '/badges/knowledge-seeker.png',
      criteriaType: 'points',
      criteriaDetails: JSON.stringify({ points: 1000 }),
      rarity: 'EPIC',
    },
  ];

  for (const badge of badges) {
    await prisma.badge.create({ data: badge });
  }
  console.log(`✅ Created ${badges.length} badges`);

  // Create sample course
  const course = await prisma.course.create({
    data: {
      tutorId: tutor.id,
      title: 'Introduction to Mathematics',
      description: 'Learn the fundamentals of mathematics including algebra, geometry, and basic calculus.',
      subjectCategory: 'Mathematics',
      educationLevel: 'SECONDARY',
      difficulty: 'BEGINNER',
      thumbnailUrl: '/course-thumbnails/math-intro.jpg',
      price: 0,
      pricingModel: 'FREE',
      estimatedHours: 20,
      language: 'en',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
  console.log('✅ Created sample course:', course.title);

  // Create sample lessons for the course
  const lessons = [
    {
      courseId: course.id,
      title: 'Introduction to Algebra',
      learningObjectives: 'Understand basic algebraic concepts and solve simple equations',
      videoUrl: '/videos/lesson1.mp4',
      notesContent: '# Algebra Basics\n\nAlgebra is a branch of mathematics...',
      sequenceOrder: 1,
      estimatedDuration: 45,
    },
    {
      courseId: course.id,
      title: 'Linear Equations',
      learningObjectives: 'Solve linear equations and understand their graphical representation',
      videoUrl: '/videos/lesson2.mp4',
      notesContent: '# Linear Equations\n\nLinear equations are equations...',
      sequenceOrder: 2,
      estimatedDuration: 60,
    },
    {
      courseId: course.id,
      title: 'Quadratic Equations',
      learningObjectives: 'Solve quadratic equations using various methods',
      videoUrl: '/videos/lesson3.mp4',
      notesContent: '# Quadratic Equations\n\nQuadratic equations are...',
      sequenceOrder: 3,
      estimatedDuration: 75,
    },
  ];

  for (const lesson of lessons) {
    const createdLesson = await prisma.lesson.create({ data: lesson });
    
    // Create a quiz for each lesson
    const quiz = await prisma.quiz.create({
      data: {
        lessonId: createdLesson.id,
        title: `${createdLesson.title} - Quiz`,
        instructions: 'Answer all questions to test your understanding.',
        timeLimitMinutes: 15,
        passingPercentage: 70,
        maxAttempts: 3,
        shuffleQuestions: true,
        shuffleAnswers: true,
        immediateFeedback: true,
      },
    });

    // Create sample questions
    const question1 = await prisma.question.create({
      data: {
        quizId: quiz.id,
        questionType: 'MULTIPLE_CHOICE',
        questionText: 'What is 2 + 2?',
        points: 10,
        explanation: 'Basic addition: 2 + 2 = 4',
        sequenceOrder: 1,
      },
    });

    await prisma.answerOption.createMany({
      data: [
        { questionId: question1.id, optionText: '3', isCorrect: false, sequenceOrder: 1 },
        { questionId: question1.id, optionText: '4', isCorrect: true, sequenceOrder: 2 },
        { questionId: question1.id, optionText: '5', isCorrect: false, sequenceOrder: 3 },
        { questionId: question1.id, optionText: '6', isCorrect: false, sequenceOrder: 4 },
      ],
    });

    const question2 = await prisma.question.create({
      data: {
        quizId: quiz.id,
        questionType: 'TRUE_FALSE',
        questionText: 'Is mathematics important for problem-solving?',
        points: 10,
        explanation: 'Mathematics develops critical thinking and problem-solving skills.',
        sequenceOrder: 2,
      },
    });

    await prisma.answerOption.createMany({
      data: [
        { questionId: question2.id, optionText: 'True', isCorrect: true, sequenceOrder: 1 },
        { questionId: question2.id, optionText: 'False', isCorrect: false, sequenceOrder: 2 },
      ],
    });
  }
  console.log(`✅ Created ${lessons.length} lessons with quizzes`);

  // Enroll student in the course
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Enrolled student in sample course');

  console.log('🎉 Database seeding completed!');
  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@educonnect.com / Admin@123');
  console.log('Tutor: tutor@educonnect.com / Tutor@123');
  console.log('Student: student@educonnect.com / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
