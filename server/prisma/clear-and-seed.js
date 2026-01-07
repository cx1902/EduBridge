const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Clearing existing users...')

    // Delete all users (this will cascade delete related records)
    await prisma.user.deleteMany()
    console.log('✅ Users cleared')

    console.log('🌱 Creating demo accounts...')

    // Create default admin user
    const adminPassword = await bcrypt.hash('Admin@123', 10)
    const admin = await prisma.user.create({
        data: {
            email: 'admin@edubridge.com',
            passwordHash: adminPassword,
            role: 'ADMIN',
            firstName: 'Admin',
            lastName: 'User',
            emailVerified: true,
            status: 'ACTIVE'
        }
    })
    console.log('✅ Created admin user:', admin.email)

    // Create sample tutor
    const tutorPassword = await bcrypt.hash('Tutor@123', 10)
    const tutor = await prisma.user.create({
        data: {
            email: 'tutor@edubridge.com',
            passwordHash: tutorPassword,
            role: 'TUTOR',
            firstName: 'John',
            lastName: 'Smith',
            emailVerified: true,
            status: 'ACTIVE'
        }
    })
    console.log('✅ Created tutor user:', tutor.email)

    // Create sample student
    const studentPassword = await bcrypt.hash('Student@123', 10)
    const student = await prisma.user.create({
        data: {
            email: 'student@edubridge.com',
            passwordHash: studentPassword,
            role: 'STUDENT',
            firstName: 'Jane',
            lastName: 'Doe',
            emailVerified: true,
            status: 'ACTIVE'
        }
    })
    console.log('✅ Created student user:', student.email)

    console.log('\n🎉 Demo accounts created successfully!')
    console.log('\n📝 Login Credentials:')
    console.log('Admin: admin@edubridge.com / Admin@123')
    console.log('Tutor: tutor@edubridge.com / Tutor@123')
    console.log('Student: student@edubridge.com / Student@123')
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
