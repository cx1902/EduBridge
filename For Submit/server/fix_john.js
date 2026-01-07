
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixJohn() {
    console.log('Fixing John Wick...');
    const users = await prisma.user.findMany({
        where: {
            firstName: 'John',
            lastName: 'Wick'
        }
    });

    if (users.length === 0) {
        console.log('John Wick not found!');
        return;
    }

    const john = users[0];
    console.log(`Found John (ID: ${john.id}). Promoting to TUTOR...`);

    await prisma.user.update({
        where: { id: john.id },
        data: { role: 'TUTOR' }
    });

    console.log('Creating Tutor Profile...');
    const existingProfile = await prisma.tutorProfile.findUnique({
        where: { userId: john.id }
    });

    if (!existingProfile) {
        await prisma.tutorProfile.create({
            data: {
                userId: john.id,
                hourlyRate: 50,
                bio: 'I am a professional hitman... I mean tutor.',
                languages: ['English', 'Russian'],
                levelsSupported: ['UNIVERSITY']
            }
        });
        console.log('Profile created!');
    } else {
        console.log('Profile already exists.');
    }

    // Also add a subject
    const subject = await prisma.subject.upsert({
        where: { name: 'Mathematics' },
        update: {},
        create: { name: 'Mathematics' }
    });

    await prisma.tutorSubject.upsert({
        where: {
            tutorId_subjectId: {
                tutorId: john.id,
                subjectId: subject.id
            }
        },
        update: {},
        create: {
            tutorId: john.id,
            subjectId: subject.id,
            skillLevel: 'ADVANCED'
        }
    });
    console.log('Subject added!');
}

fixJohn().catch(console.error).finally(() => prisma.$disconnect());
