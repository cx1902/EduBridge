const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const courses = await prisma.course.findMany({
        select: { id: true, title: true, status: true }
    });
    console.log('--- COURSES ---');
    courses.forEach(c => {
        console.log(`[${c.status}] ${c.title} (${c.id})`);
    });
    console.log('---------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
