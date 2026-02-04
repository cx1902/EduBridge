const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateAllProgress() {
    try {
        console.log('Starting progress recalculation...');

        // Get all enrollments
        const enrollments = await prisma.enrollment.findMany({
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        _count: {
                            select: {
                                lessons: true
                            }
                        }
                    }
                },
                progressRecords: {
                    where: {
                        completed: true
                    }
                }
            }
        });

        console.log(`Found ${enrollments.length} enrollments to process`);

        for (const enrollment of enrollments) {
            const totalLessons = enrollment.course._count.lessons;
            const completedCount = enrollment.progressRecords.length;
            const correctProgressPercentage = totalLessons > 0
                ? Math.round((completedCount / totalLessons) * 100)
                : 0;

            // Only update if the progress percentage is different
            if (enrollment.progressPercentage !== correctProgressPercentage) {
                await prisma.enrollment.update({
                    where: { id: enrollment.id },
                    data: {
                        progressPercentage: correctProgressPercentage,
                        completedAt: correctProgressPercentage >= 100 ? new Date() : null
                    }
                });

                console.log(`Updated enrollment ${enrollment.id} for course "${enrollment.course.title}": ${enrollment.progressPercentage}% -> ${correctProgressPercentage}% (${completedCount}/${totalLessons} lessons)`);
            }
        }

        console.log('Progress recalculation completed successfully!');
    } catch (error) {
        console.error('Error recalculating progress:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recalculateAllProgress();
