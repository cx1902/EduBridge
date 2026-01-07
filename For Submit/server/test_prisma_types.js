const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get a valid course ID and tutor token/ID
    // For simplicity, we'll pick the first course and try to call the endpoint from the controller logic directly 
    // or simulate the request if we can authenticat.
    // Actually, easiest is to just use the controller logic locally to see if it throws with bad types
    // But we need to use the endpoint to test the actual serialization.
    // Let's just use Prisma directly to test type sensitivity.

    try {
        const course = await prisma.course.findFirst();
        if (!course) {
            console.log('No course found');
            return;
        }

        console.log(`Testing with course: ${course.id}`);

        // Test 1: estimatedDuration as string '30'
        console.log('Test 1: estimatedDuration as string "30"');
        try {
            await prisma.lesson.create({
                data: {
                    courseId: course.id,
                    title: 'Test Lesson String Duration',
                    learningObjectives: 'Obj',
                    content: 'Content',
                    estimatedDuration: '30', // PASSING STRING
                    published: true,
                    sequenceOrder: 999
                }
            });
            console.log('Test 1 PASSED (Prisma accepted string)');
        } catch (e) {
            console.log('Test 1 FAILED (Prisma rejected string):', e.message);
        }

        // Test 2: published as undefined logic simulation
        // published: published !== undefined ? published : true
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
