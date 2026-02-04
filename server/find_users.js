const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUsers() {
    try {
        // Get the first available tutor
        const tutor = await prisma.user.findFirst({
            where: { role: 'TUTOR' }
        });

        const student1 = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Charng', mode: 'insensitive' } },
                    { email: { contains: 'charng', mode: 'insensitive' } }
                ]
            }
        });

        const student2 = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Lawson', mode: 'insensitive' } },
                    { email: { contains: 'lawson', mode: 'insensitive' } }
                ]
            }
        });

        console.log('=== USER IDS ===');
        console.log('Tutor:', tutor?.email, '|', tutor?.id);
        console.log('Student 1 (Charng Shin):', student1?.email, '|', student1?.id);
        console.log('Student 2 (Lawson):', student2?.email, '|', student2?.id);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findUsers();
