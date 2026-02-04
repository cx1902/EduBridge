const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding badges...');

    const badges = [
        {
            name: 'First Steps',
            description: 'Complete your first lesson',
            iconUrl: '/badges/first-steps.png',
            criteriaType: 'lesson_completion',
            criteriaDetails: JSON.stringify({ count: 1 }),
            rarity: 'COMMON'
        },
        {
            name: 'Quiz Master',
            description: 'Pass your first quiz',
            iconUrl: '/badges/quiz-master.png',
            criteriaType: 'quiz_pass',
            criteriaDetails: JSON.stringify({ count: 1 }),
            rarity: 'COMMON'
        },
        {
            name: 'Week Warrior',
            description: 'Maintain a 7-day learning streak',
            iconUrl: '/badges/week-warrior.png',
            criteriaType: 'streak',
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
            criteriaType: 'course_completion',
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
            name: 'Knowledge Seeker',
            description: 'Accumulate 1000 points',
            iconUrl: '/badges/knowledge-seeker.png',
            criteriaType: 'points',
            criteriaDetails: JSON.stringify({ points: 1000 }),
            rarity: 'EPIC'
        },
        {
            name: 'Century Club',
            description: 'Accumulate 100 points',
            iconUrl: '/badges/century-club.png',
            criteriaType: 'points',
            criteriaDetails: JSON.stringify({ points: 100 }),
            rarity: 'RARE'
        }
    ];

    for (const badgeData of badges) {
        const existing = await prisma.badge.findUnique({
            where: { name: badgeData.name }
        });

        if (!existing) {
            await prisma.badge.create({ data: badgeData });
            console.log(`✅ Created badge: ${badgeData.name}`);
        } else {
            console.log(`ℹ️ Badge already exists: ${badgeData.name}`);
        }
    }

    console.log('✨ Badge seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding badges:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
