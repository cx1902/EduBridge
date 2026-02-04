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

    const passedQuizzes = await prisma.quizAttempt.count({
        where: { userId: user.id, passed: true }
    });

    console.log(`User ${user.firstName} has ${passedQuizzes} passed quizzes.`);

    const badges = await prisma.badge.findMany({
        where: { criteriaType: 'quiz_pass' }
    });

    for (const badge of badges) {
        let details = {};
        try { details = JSON.parse(badge.criteriaDetails || '{}'); } catch (e) { }

        const countNeeded = details.count || 1;

        if (passedQuizzes >= countNeeded) {
            const existing = await prisma.userBadge.findFirst({
                where: { userId: user.id, badgeId: badge.id }
            });

            if (!existing) {
                await prisma.userBadge.create({
                    data: {
                        userId: user.id,
                        badgeId: badge.id,
                        earnedAt: new Date()
                    }
                });
                console.log(`AWARDED: ${badge.name}`);
            } else {
                console.log(`ALREADY HAS: ${badge.name}`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
