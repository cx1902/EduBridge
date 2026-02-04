
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTutorStats() {
    try {
        console.log('--- Finding Tutors ---');
        // Find users with role TUTOR
        const tutors = await prisma.user.findMany({
            where: { role: 'TUTOR' },
            select: { id: true, email: true, firstName: true, lastName: true }
        });

        console.log(`Found ${tutors.length} tutors.`);

        for (const tutor of tutors) {
            console.log(`\nChecking stats for Tutor: ${tutor.firstName} ${tutor.lastName} (${tutor.email}) [ID: ${tutor.id}]`);

            // 1. Check Courses
            const courses = await prisma.course.findMany({
                where: { tutorId: tutor.id },
                select: { id: true, title: true, status: true }
            });
            console.log(`- Total Courses Found: ${courses.length}`);
            courses.forEach(c => console.log(`  > [${c.id}] ${c.title} - Status: '${c.status}'`));

            // 2. Check Enrollments via Courses
            const courseIds = courses.map(c => c.id);
            const enrollments = await prisma.enrollment.findMany({
                where: { courseId: { in: courseIds } },
                select: { id: true, status: true, courseId: true, userId: true }
            });
            console.log(`- Total Enrollments Found: ${enrollments.length}`);
            enrollments.forEach(e => console.log(`  > [${e.id}] status: '${e.status}' (Course: ${e.courseId})`));


            // Simulate Controller Date Logic
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            console.log(`\n  [Controller Logic Check]`);
            console.log(`  Today (Start): ${today.toISOString()}`);
            console.log(`  Tomorrow (End): ${tomorrow.toISOString()}`);

            const todaysSessions = await prisma.tutoringSession.findMany({
                where: {
                    tutorId: tutor.id,
                    scheduledStart: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            });
            console.log(`  Sessions found in this range: ${todaysSessions.length}`);
            todaysSessions.forEach(s => {
                console.log(`   > ID: ${s.id} | Start: ${s.scheduledStart.toISOString()} | Status: ${s.status}`);
            });

            const allSessions = await prisma.tutoringSession.findMany({
                where: { tutorId: tutor.id }
            });
            console.log(`  [All Sessions Check] Total sessions in DB for this tutor: ${allSessions.length}`);
            allSessions.forEach(s => {
                console.log(`   > ID: ${s.id} | Start: ${s.scheduledStart.toISOString()} | Status: ${s.status}`);
            });
            // 3. Check Sessions
            const sessions = await prisma.tutoringSession.findMany({
                where: { tutorId: tutor.id },
                select: { id: true, status: true, scheduledStart: true, scheduledEnd: true }
            });
            console.log(`- Total Sessions Found: ${sessions.length}`);

            const now = new Date();
            console.log(`  Current Server Time: ${now.toISOString()}`);

            sessions.forEach(s => {
                const start = new Date(s.scheduledStart);
                const isUpcoming = start >= now;
                const isToday = isSameDay(start, now);
                console.log(`  > [${s.id}] Status: '${s.status}', Start: ${s.scheduledStart.toISOString()} (Upcoming: ${isUpcoming}, Today: ${isToday})`);
            });
        }

    } catch (error) {
        console.error('Error running debug script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

debugTutorStats();
