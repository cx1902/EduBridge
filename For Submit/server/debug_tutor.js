
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Searching for users matching "John" or "Wick"...');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: 'John', mode: 'insensitive' } },
                { lastName: { contains: 'John', mode: 'insensitive' } },
                { firstName: { contains: 'Wick', mode: 'insensitive' } },
                { lastName: { contains: 'Wick', mode: 'insensitive' } }
            ]
        },
        include: {
            tutorProfile: true,
            tutorSubjects: true
        }
    });

    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        console.log('------------------------------------------------');
        console.log(`ID: ${u.id}`);
        console.log(`Name: ${u.firstName} ${u.lastName}`);
        console.log(`Role: ${u.role}`);
        console.log(`Status: ${u.status}`);
        console.log(`Has Tutor Profile? ${u.tutorProfile ? 'YES' : 'NO'}`);
        if (u.tutorProfile) {
            console.log(`  Profile ID: ${u.tutorProfile.id}`);
        } else {
            console.log('  ❌ MISSING TUTOR PROFILE - This user will NOT appear in search.');
        }
        if (u.role !== 'TUTOR') console.log('  ❌ WRONG ROLE - Must be TUTOR.');
        if (u.status !== 'ACTIVE') console.log('  ❌ INACTIVE - Must be ACTIVE.');
    });
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
