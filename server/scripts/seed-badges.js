const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding badges only...');

    const badges = [
        {
            name: 'First Steps',
            description: 'Complete your first lesson',
            iconUrl: '/badges/first-steps.png',
            criteriaType: 'FIRST_LESSON',
            criteriaDetails: JSON.stringify({ count: 1 }),
            rarity: 'COMMON'
        },
        {
            name: 'Quiz Master',
            description: 'Pass your first quiz',
            iconUrl: '/badges/quiz-master.png',
            criteriaType: 'QUIZ_MASTER',
            criteriaDetails: JSON.stringify({ count: 1 }),
            rarity: 'COMMON'
        },
        {
            name: 'Week Warrior',
            description: 'Maintain a 7-day learning streak',
            iconUrl: '/badges/week-warrior.png',
            criteriaType: 'SEVEN_DAY_STREAK',
            criteriaDetails: JSON.stringify({ days: 7 }),
            rarity: 'RARE'
        },
        {
            name: 'Month Master',
            description: 'Maintain a 30-day learning streak',
            iconUrl: '/badges/month-master.png',
            criteriaType: 'streak',
            criteriaDetails: JSON.stringify({ days: 30 }),
            rarity: 'EPIC'
        },
        {
            name: 'Course Conqueror',
            description: 'Complete your first course',
            iconUrl: '/badges/course-conqueror.png',
            criteriaType: 'FIRST_COURSE',
            criteriaDetails: JSON.stringify({ count: 1 }),
            rarity: 'RARE'
        },
        {
            name: 'Perfect Score',
            description: 'Achieve 100% on a quiz',
            iconUrl: '/badges/perfect-score.png',
            criteriaType: 'quiz_perfect',
            criteriaDetails: JSON.stringify({ score: 100 }),
            rarity: 'EPIC'
        },
        {
            name: 'Live Learner',
            description: 'Attend 10 live tutoring sessions',
            iconUrl: '/badges/live-learner.png',
            criteriaType: 'session_attendance',
            criteriaDetails: JSON.stringify({ count: 10 }),
            rarity: 'RARE'
        },
        {
            name: 'Century Club',
            description: 'Accumulate 100 points',
            iconUrl: '/badges/century-club.png',
            criteriaType: 'CENTURY_CLUB',
            criteriaDetails: JSON.stringify({ points: 100 }),
            rarity: 'EPIC'
        }
    ];

    // Using createMany with skipDuplicates to safely seed
    const result = await prisma.badge.createMany({
        data: badges,
        skipDuplicates: true,
    });

    console.log(`✅ Badges seeded. Count: ${result.count}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding badges:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
