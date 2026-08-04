const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const password = await bcrypt.hash('morador123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'morador@solemar.local' },
      update: { password, role: 'MORADOR', name: 'Morador Demo' },
      create: { email: 'morador@solemar.local', password, role: 'MORADOR', name: 'Morador Demo' }
    });
    console.log(JSON.stringify({ email: user.email, password: 'morador123', role: user.role }));
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
