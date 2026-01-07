require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
    const email = 'charngshin243@gmail.com'; // Target user
    console.log(`Force Approving user: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found');
        return;
    }
    console.log('User ID:', user.id);

    // Find all applications
    const apps = await prisma.tutorVerificationApplication.findMany({
        where: { userId: user.id }
    });
    console.log('Found Applications:', apps);

    if (apps.length === 0) {
        console.log('Creating NEW Approved Application...');
        await prisma.tutorVerificationApplication.create({
            data: {
                userId: user.id,
                status: 'APPROVED',
                qualifications: 'Force Approved by Debug Script',
                submittedAt: new Date(),
                reviewedAt: new Date()
            }
        });
    } else {
        // Update ALL to APPROVED
        console.log('Updating ALL applications to APPROVED...');
        await prisma.tutorVerificationApplication.updateMany({
            where: { userId: user.id },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date()
            }
        });
    }
    console.log('✅ Update Complete. User should be APPROVED.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // Keep connection open or close? Script ends anyway.
        // await prisma.$disconnect(); 
    });
