const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteEnrollment() {
    const userId = 'f6835caf-3c07-4ea5-83c5-dd8701b28a28';
    const courseId = '9be48114-2c0e-41be-ba39-04d0f22527fa';

    try {
        // 1. Delete progress records associated with this enrollment
        // Progress records have a userId and lessonId, but also link via enrollmentId
        const progressDeletion = await prisma.progress.deleteMany({
            where: {
                userId: userId,
                lesson: {
                    courseId: courseId
                }
            }
        });
        console.log(`Deleted ${progressDeletion.count} progress records.`);

        // 2. Delete the enrollment record
        const enrollmentDeletion = await prisma.enrollment.delete({
            where: {
                userId_courseId: {
                    userId: userId,
                    courseId: courseId
                }
            }
        });
        console.log('Enrollment record deleted successfully:', enrollmentDeletion.id);

        // 3. Decrement course enrollment count
        await prisma.course.update({
            where: { id: courseId },
            data: {
                enrollmentCount: {
                    decrement: 1
                }
            }
        });
        console.log('Course enrollment count decremented.');

    } catch (error) {
        if (error.code === 'P2025') {
            console.log('Enrollment record not found or already deleted.');
        } else {
            console.error('Error deleting enrollment:', error);
        }
    } finally {
        await prisma.$disconnect();
    }
}

deleteEnrollment();
