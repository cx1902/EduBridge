const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const badge = await prisma.badge.findFirst({
        where: { name: 'Quiz Master' }
    });

    if (!badge) {
        console.log('Badge "Quiz Master" not found');
    } else {
        console.log(`BADGE: ${badge.name} | TYPE: ${badge.criteriaType} | DETAILS: ${badge.criteriaDetails}`);
    }

    const user = await prisma.user.findFirst({
        where: { firstName: 'Charng Shin', lastName: 'Chai' }
    });

    if (user) {
        const passedQuizzes = await prisma.quizAttempt.count({
            where: {
                userId: user.id,
                passed: true,
                scorePercentage: { gte: 80 }
            }
        });
        console.log(`USER: ${user.firstName} ${user.lastName} | PASSED QUIZZES (>=80%): ${passedQuizzes}`);

        // Check if user already has it
        const earned = await prisma.userBadge.findFirst({
            where: { userId: user.id, badgeId: badge?.id }
        });
        console.log(`ALREADY EARNED: ${earned ? 'YES' : 'NO'}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
