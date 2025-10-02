// Temporary seed script. Keep TypeScript checks but use safe operations compatible with the Prisma schema.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // For now, keep seed minimal: ensure departments/subDepartments exist and create three example categories
  await prisma.department.createMany({
    data: [
      { code: 'KIDS', name: 'Kids Fashion' },
      { code: 'MENS', name: 'Mens Fashion' },
      { code: 'LADIES', name: 'Ladies Fashion' }
    ],
    skipDuplicates: true
  })

  // Create a minimal set of categories to make the app usable
  const categoriesData = [
    { code: 'SHIRTS', displayName: 'Shirts & Tops', description: 'T-shirts and tops', sortOrder: 1 },
    { code: 'PANTS', displayName: 'Pants & Bottoms', description: 'Trousers and shorts', sortOrder: 2 },
    { code: 'DRESSES', displayName: 'Dresses', description: 'Dresses and gowns', sortOrder: 3 }
  ]

  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { code: cat.code } })
    if (!existing) {
      await prisma.category.create({
        data: {
          code: cat.code,
          displayName: cat.displayName,
          description: cat.description,
          sortOrder: cat.sortOrder,
          isActive: true
        }
      })
    }
  }

  // (Removed detailed category upserts - we created minimal categories above)

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
