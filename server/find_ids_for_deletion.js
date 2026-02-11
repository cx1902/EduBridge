const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findIds() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'cscs6945@gmail.com' },
            select: { id: true, firstName: true, lastName: true }
        });

        const course = await prisma.course.findFirst({
            where: { title: { contains: 'Blockchain', mode: 'insensitive' } },
            select: { id: true, title: true }
        });

        console.log('User Found:', user);
        console.log('Course Found:', course);

        if (user && course) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: course.id
                    }
                }
            });
            console.log('Enrollment Found:', enrollment);
        }
    } catch (error) {
        console.error('Error finding IDs:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findIds();
