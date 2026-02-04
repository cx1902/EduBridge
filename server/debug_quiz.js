const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugQuiz() {
    const lessonId = '1c2dbb5a-7333-405e-a69d-c9fb5e895215';

    console.log('--- Checking Lesson ---');
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    tutorId: true
                }
            }
        }
    });

    if (!lesson) {
        console.log('Lesson not found');
        return;
    }

    console.log('Lesson:', lesson.title);

    console.log('\n--- Checking Quiz ---');
    const quiz = await prisma.quiz.findFirst({
        where: { lessonId }
    });

    if (!quiz) {
        console.log('No quiz found for this lesson.');
    } else {
        console.log('Quiz Title:', quiz.title);
        console.log('Max Attempts:', quiz.maxAttempts);

        console.log('\n--- Checking Attempts ---');
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: lesson.courseId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        for (const e of enrollments) {
            const attempts = await prisma.quizAttempt.count({
                where: {
                    userId: e.user.id,
                    quizId: quiz.id
                }
            });
            console.log(`- ${e.user.firstName} ${e.user.lastName} (${e.user.email}): ${attempts} attempts`);
            if (quiz.maxAttempts && attempts >= quiz.maxAttempts) {
                console.log(`  !! Max attempts reached for this user.`);
            }
        }
    }

    process.exit(0);
}

debugQuiz().catch(err => {
    console.error(err);
    process.exit(1);
});
