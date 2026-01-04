const { PrismaClient } = require('@prisma/client')

// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error']
})

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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma
