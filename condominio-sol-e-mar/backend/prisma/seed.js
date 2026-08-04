const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

async function main() {
  const prisma = new PrismaClient()

  const password = await bcrypt.hash('senha123', 10)

  // Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@solemar.local' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@solemar.local',
      password,
      role: 'ADMIN'
    }
  })

  // Create Síndico
  await prisma.user.upsert({
    where: { email: 'sindico@solemar.local' },
    update: {},
    create: {
      name: 'Síndico',
      email: 'sindico@solemar.local',
      password,
      role: 'SINDICO'
    }
  })

  console.log('Seed finished.')
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
