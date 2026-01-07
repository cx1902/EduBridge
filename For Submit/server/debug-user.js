require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
    const email = 'charngshin243@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tutorVerification: true // Check relation
        }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User Role:', user.role);
    console.log('User ID:', user.id);
    console.log('TutorVerification (via relation):', user.tutorVerification);

    // Manual check
    const manualVer = await prisma.tutorVerificationApplication.findFirst({
        where: { userId: user.id }
    });
    console.log('TutorVerification (manual check):', manualVer);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
