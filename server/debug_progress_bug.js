const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugProgress() {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Charng', mode: 'insensitive' } },
                    { lastName: { contains: 'Chai', mode: 'insensitive' } }
                ]
            },
            select: { id: true, email: true, firstName: true, lastName: true }
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
                },
                include: {
                    _count: {
                        select: { progressRecords: { where: { completed: true } } }
                    }
                }
            });
            console.log('Enrollment Found:', JSON.stringify(enrollment, null, 2));

            const lessons = await prisma.lesson.findMany({
                where: { courseId: course.id },
                select: { id: true, title: true }
            });
            console.log('Total Lessons in Course:', lessons.length);

            const progress = await prisma.progress.findMany({
                where: {
                    userId: user.id,
                    lesson: { courseId: course.id }
                }
            });
            console.log('Progress records:', JSON.stringify(progress, null, 2));
        }
    } catch (error) {
        console.error('Error debugging progress:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugProgress();
