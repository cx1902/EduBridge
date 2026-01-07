
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- DB CHECK START ---');
    try {
        // 1. Check if we can query the table
        console.log('Attempting to count verification applications...');
        const count = await prisma.tutorVerificationApplication.count();
        console.log(`✅ Success! Count: ${count}`);

        // 2. Check for the specific user the user just created (Tutors)
        console.log('Checking recent tutors...');
        const tutors = await prisma.user.findMany({
            where: { role: 'TUTOR' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { tutorApplications: true }
        });

        tutors.forEach(t => {
            console.log(`Tutor: ${t.email} (${t.id})`);
            console.log(`   Applications: ${JSON.stringify(t.tutorApplications)}`);
        });

        // 3. Simulate Admin Query
        console.log('--- Simulating Admin Query ---');
        const adminApps = await prisma.tutorVerificationApplication.findMany({
            where: {}, // All apps
            include: {
                applicant: {
                    select: { email: true }
                }
            }
        });
        console.log(`Admin Query found: ${adminApps.length} apps`);
        if (adminApps.length > 0) {
            console.log('First App:', JSON.stringify(adminApps[0], null, 2));
        } else {
            console.log('Admin Query returned NOTHING.');
        }

    } catch (error) {
        console.error('❌ ERROR checking database:');
        console.error(error.message);
        if (error.code) console.error(`Error Code: ${error.code}`);
    } finally {
        await prisma.$disconnect();
        console.log('--- DB CHECK END ---');
    }
}

check();
