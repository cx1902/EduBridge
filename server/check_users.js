
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true, // Only checking if it exists/length
            tutorApplications: true // Correct relation name
        }
    });

    console.log('--- User Accounts ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`Role: ${u.role}`);
        console.log(`Status: ${u.status}`);
        console.log(`PasswordHash Length: ${u.passwordHash ? u.passwordHash.length : 'NULL'}`);
        console.log(`TutorApplications: ${JSON.stringify(u.tutorApplications)}`);
        console.log('---------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
