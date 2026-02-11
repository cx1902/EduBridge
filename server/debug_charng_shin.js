const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCharngShin() {
    try {
        const userId = '8a4e93a6-bbee-4da3-a609-5f370b591787';
        const courseId = '9be48114-2c0e-41be-ba39-04d0f22527fa';

        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });

        const progress = await prisma.progress.findMany({
            where: { userId, enrollmentId: enrollment?.id }
        });

        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            select: { id: true, title: true }
        });

        console.log('Enrollment:', JSON.stringify(enrollment, null, 2));
        console.log('Progress Records:', JSON.stringify(progress, null, 2));
        console.log('Course Lessons:', lessons.length);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCharngShin();
