const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const johnSmithId = '09d8155c-2488-4c54-8334-56b9502f39a2';
    const johnSonId = '3d7de768-3156-4f1e-8703-f20815767450';

    // 1. Ensure Subjects exist
    const math = await prisma.subject.upsert({
        where: { name: 'Mathematics' },
        update: {},
        create: { name: 'Mathematics' }
    });

    const cs = await prisma.subject.upsert({
        where: { name: 'Computer Science' },
        update: {},
        create: { name: 'Computer Science' }
    });

    // 2. Clear existing subjects for these tutors
    await prisma.tutorSubject.deleteMany({
        where: {
            tutorId: { in: [johnSmithId, johnSonId] }
        }
    });

    // 3. Add new subjects
    await prisma.tutorSubject.create({
        data: {
            tutorId: johnSmithId,
            subjectId: math.id,
            skillLevel: 'ADVANCED'
        }
    });

    await prisma.tutorSubject.create({
        data: {
            tutorId: johnSonId,
            subjectId: cs.id,
            skillLevel: 'ADVANCED'
        }
    });

    console.log('Tutor subjects updated successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
