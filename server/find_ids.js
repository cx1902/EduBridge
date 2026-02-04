const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: 'John', lastName: 'Smith' },
                { firstName: 'John', lastName: 'Son' }
            ]
        },
        select: {
            id: true,
            firstName: true,
            lastName: true
        }
    });

    const subjects = await prisma.subject.findMany({
        where: {
            name: {
                in: ['Mathematics', 'Computer Science']
            }
        }
    });

    console.log('USERS:', JSON.stringify(users, null, 2));
    console.log('SUBJECTS:', JSON.stringify(subjects, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
