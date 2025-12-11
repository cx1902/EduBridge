const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function publishCourses() {
  try {
    // Update all DRAFT courses to PUBLISHED
    const result = await prisma.course.updateMany({
      where: {
        status: 'DRAFT'
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    console.log(`✅ Successfully published ${result.count} course(s)!`);
    
    // Show the published courses
    const publishedCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true
      }
    });

    console.log('\n📚 Published Courses:');
    publishedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (${course.id})`);
    });

  } catch (error) {
    console.error('❌ Error publishing courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

publishCourses();
