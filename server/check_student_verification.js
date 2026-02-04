const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudent() {
    try {
        const student = await prisma.user.findFirst({
            where: {
                firstName: 'Charng Shin',
                lastName: 'Chai'
            }
        });

        if (student) {
            console.log('Student Found:', student.email);
            console.log('ID:', student.id);
            console.log('Email Verified:', student.emailVerified);
            console.log('Status:', student.status);

            if (!student.emailVerified) {
                console.log('Updating student to verified for testing...');
                await prisma.user.update({
                    where: { id: student.id },
                    data: { emailVerified: true }
                });
                console.log('Student updated to verified.');
            }
        } else {
            console.log('Student not found.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudent();
