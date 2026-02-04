const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true
            }
        });

        console.log('=== ALL USERS ===');
        users.forEach(u => {
            console.log(`${u.role.padEnd(10)} | ${u.email.padEnd(30)} | ${u.firstName} ${u.lastName} | ${u.id}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listAllUsers();
