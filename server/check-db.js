const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking Database...');

  // 1. Check Users
  const userCount = await prisma.user.count();
  console.log(`Total Users: ${userCount}`);

  // 2. Check Admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (admin) {
    console.log('Admin found:', admin.id, admin.email);
  } else {
    console.log('NO ADMIN FOUND!');
    // Create one for testing
    /*
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: 'placeholder',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    });
    console.log('Created test admin:', newAdmin.id);
    */
  }

  // 3. Test Message Creation (if admin exists)
  if (admin) {
    try {
      console.log('Attempting to create a test message...');
      const message = await prisma.inboxMessage.create({
        data: {
          senderId: admin.id, // Self message
          receiverId: admin.id,
          subject: 'Test Message',
          content: 'This is a test',
          type: 'ADMIN_TICKET'
        }
      });
      console.log('Successfully created message:', message.id);
      
      // Clean up
      await prisma.inboxMessage.delete({ where: { id: message.id } });
      console.log('Test message deleted.');
    } catch (e) {
      console.error('FAILED to create message:', e);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
