/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import seeders from './index'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  for (const seed of seeders) {
    const seedStatus = await seed(prisma)
    // console.log(seedStatus)
  }
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })