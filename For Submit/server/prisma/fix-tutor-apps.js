const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTutorApplications() {
    console.log('🔄 Checking for tutors without verification applications...');

    try {
        // 1. Get all tutors
        const tutors = await prisma.user.findMany({
            where: { role: 'TUTOR' },
            include: { tutorApplications: true }
        });

        console.log(`Found ${tutors.length} tutors in total.`);

        let fixedCount = 0;

        // 2. Check each tutor
        for (const tutor of tutors) {
            if (!tutor.tutorApplications || tutor.tutorApplications.length === 0) {
                console.log(`⚠️ Tutor ${tutor.email} is missing verification application. Creating one...`);

                // Create missing record
                await prisma.tutorVerificationApplication.create({
                    data: {
                        userId: tutor.id,
                        status: 'PENDING',
                        qualifications: 'Pending Submission',
                        submittedAt: new Date(tutor.createdAt), // Use their signup time
                    }
                });

                fixedCount++;
                console.log(`✅ Fixed: ${tutor.email}`);
            }
        }

        if (fixedCount === 0) {
            console.log('✨ All tutors already have verification applications. No fixes needed.');
        } else {
            console.log(`🎉 Successfully created ${fixedCount} missing verification applications!`);
        }

    } catch (error) {
        console.error('❌ Error fixing tutor applications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTutorApplications();
