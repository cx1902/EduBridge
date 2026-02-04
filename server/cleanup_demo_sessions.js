const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDemoSessions() {
    try {
        console.log('Cleaning up old demo sessions...');

        // Find the tutor
        const tutor = await prisma.user.findFirst({
            where: { role: 'TUTOR' }
        });

        if (!tutor) {
            console.log('No tutor found');
            return;
        }

        // Delete all Blockchain sessions for the tutor
        const deleted = await prisma.tutoringSession.deleteMany({
            where: {
                tutorId: tutor.id,
                subject: 'Blockchain'
            }
        });

        console.log(`✓ Deleted ${deleted.count} Blockchain sessions`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDemoSessions();
