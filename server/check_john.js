const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJohn() {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'John', mode: 'insensitive' } },
                    { lastName: { contains: 'John', mode: 'insensitive' } }
                ]
            },
            include: {
                tutorProfile: true, // Correct relation name
                tutorApplications: true // Correct relation name
            }
        });

        console.log('Found users:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkJohn();
