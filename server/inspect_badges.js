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

    console.log(`USER: ${user.firstName} ${user.lastName} (ID: ${user.id}) | XP: ${user.totalPoints}`);

    const earned = await prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true }
    });

    console.log('EARNED BADGES:');
    earned.forEach(ub => {
        console.log(`- ${ub.badge.name} (Earned at: ${ub.earnedAt})`);
    });

    const progress = await prisma.progress.count({
        where: { userId: user.id, completed: true }
    });
    console.log(`COMPLETED LESSONS: ${progress}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
