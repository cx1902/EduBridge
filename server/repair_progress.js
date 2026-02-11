const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repairProgress() {
    try {
        const userId = '8a4e93a6-bbee-4da3-a609-5f370b591787';
        const courseId = '9be48114-2c0e-41be-ba39-04d0f22527fa';

        // 1. Fetch data
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
            include: {
                _count: {
                    select: { progressRecords: { where: { completed: true } } }
                }
            }
        });

        const totalLessonsCount = await prisma.lesson.count({
            where: { courseId }
        });

        console.log('--- Diagnosis ---');
        console.log('Enrollment ID:', enrollment.id);
        console.log('Current Progress in DB:', enrollment.progressPercentage);
        console.log('Completed Progress Records Count:', enrollment._count.progressRecords);
        console.log('Total Lessons Count:', totalLessonsCount);

        const calcPercentage = totalLessonsCount > 0 ? Math.round((enrollment._count.progressRecords / totalLessonsCount) * 100) : 0;
        console.log('Calculated Percentage:', calcPercentage);

        if (enrollment.progressPercentage != calcPercentage) {
            console.log('Discrepancy found! Repairing...');
            const updated = await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    progressPercentage: calcPercentage,
                    completedAt: calcPercentage >= 100 ? new Date() : null
                }
            });
            console.log('Repair successful. New progress:', updated.progressPercentage);
        } else {
            console.log('No discrepancy found by script, but UI shows 0%. Checking if Decimal precision is an issue.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

repairProgress();
