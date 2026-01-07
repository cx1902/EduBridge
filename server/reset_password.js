
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const emails = ['charngshin243@gmail.com', 'charngshin242@gmail.com', 'admin@edubridge.com'];

    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.update({
                where: { email },
                data: { passwordHash: hashedPassword }
            });
            console.log(`✅ Password reset for ${email} to: ${password}`);
        } else {
            console.log(`⚠️ User ${email} not found.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
