const { PrismaClient } = require('@prisma/client')

// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global

const prisma = globalForPrisma.prisma || new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Add connection status tracking if not already present on the global instance
if (typeof prisma.$connected === 'undefined') {
  prisma.$connected = false

  prisma
    .$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
      prisma.$connected = true
    })
    .catch(e => {
      console.error('❌ Database connection failed:', e)
      prisma.$connected = false
    })
}

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma
