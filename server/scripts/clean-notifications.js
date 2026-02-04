const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to clean up all notifications
 * Run this to remove old/invalid notifications from the database
 */
async function cleanNotifications() {
    try {
        console.log('Starting notification cleanup...');

        // Delete all notifications
        const result = await prisma.notification.deleteMany({});

        console.log(`✅ Successfully deleted ${result.count} notifications`);
        console.log('All notifications have been cleaned. New notifications will be created correctly.');

    } catch (error) {
        console.error('❌ Error cleaning notifications:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

cleanNotifications();
