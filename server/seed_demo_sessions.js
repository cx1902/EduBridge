const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSessions() {
    try {
        console.log('Seeding sessions...');

        // Dynamically find users
        const tutor = await prisma.user.findFirst({
            where: { role: 'TUTOR' }
        });

        const student1 = await prisma.user.findFirst({
            where: {
                email: { contains: 'cschai6@gmail.com' }
            }
        });

        const student2 = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Lawson', mode: 'insensitive' } },
                    { firstName: { contains: 'Liam', mode: 'insensitive' } }
                ]
            }
        });

        if (!tutor) {
            console.error('No tutor found!');
            return;
        }

        console.log(`Using Tutor: ${tutor.email} (${tutor.id})`);
        console.log(`Student 1: ${student1?.email} (${student1?.id})`);
        console.log(`Student 2: ${student2?.email} (${student2?.id})`);

        // Session 1: Feb 4, 1:00 PM - 2:00 PM
        const start1 = new Date('2025-02-04T13:00:00');
        const end1 = new Date('2025-02-04T14:00:00');

        const session1 = await prisma.tutoringSession.create({
            data: {
                tutorId: tutor.id,
                subject: 'Blockchain',
                educationLevel: 'UNIVERSITY',
                scheduledStart: start1,
                scheduledEnd: end1,
                actualStart: start1,
                actualEnd: end1,
                maxParticipants: 5,
                sessionType: 'ONE_ON_ONE',
                status: 'COMPLETED',
                sessionNotes: 'No note',
                bookings: student1 ? {
                    create: [
                        {
                            studentId: student1.id,
                            status: 'CONFIRMED',
                        }
                    ]
                } : undefined
            }
        });

        console.log(`✓ Created Session 1: ${session1.id}`);

        // Session 2: Feb 4, 3:00 PM - 4:00 PM
        const start2 = new Date('2025-02-04T15:00:00');
        const end2 = new Date('2025-02-04T16:00:00');

        const bookings2 = [];
        if (student1) bookings2.push({ studentId: student1.id, status: 'CONFIRMED' });
        if (student2) bookings2.push({ studentId: student2.id, status: 'CONFIRMED' });

        const session2 = await prisma.tutoringSession.create({
            data: {
                tutorId: tutor.id,
                subject: 'Blockchain',
                educationLevel: 'UNIVERSITY',
                scheduledStart: start2,
                scheduledEnd: end2,
                actualStart: start2,
                actualEnd: end2,
                maxParticipants: 5,
                sessionType: 'GROUP',
                status: 'COMPLETED',
                sessionNotes: 'No note',
                bookings: bookings2.length > 0 ? {
                    create: bookings2
                } : undefined
            }
        });

        console.log(`✓ Created Session 2: ${session2.id}`);
        console.log('\n✅ Demo sessions created successfully!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedSessions();
