const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { firstName: 'Charng Shin', lastName: 'Chai' }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    const attempt = await prisma.quizAttempt.findFirst({
        where: { userId: user.id },
        include: { quiz: true },
        orderBy: { completedAt: 'desc' }
    });

    if (attempt) {
        console.log(`QUIZ: ${attempt.quiz.title}`);
        console.log(`SCORE: ${attempt.scorePercentage}%`);
        console.log(`PASSED: ${attempt.passed}`);
        console.log(`QUIZ PASSING %: ${attempt.quiz.passingPercentage}%`);
    } else {
        console.log('No quiz attempts found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
