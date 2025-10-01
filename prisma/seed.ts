import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Shirts category
  const shirtsCategory = await prisma.category.upsert({
    where: { name: 'Shirts & Tops' },
    update: {},
    create: {
      name: 'Shirts & Tops',
      description: 'T-shirts, blouses, button-downs, and casual tops',
      aiPromptTemplate: 'Analyze this shirt/top image and extract the following attributes with high accuracy. Focus on clearly visible features only.',
      sortOrder: 1,
      attributes: {
        create: [
          {
            key: 'color',
            label: 'Primary Color',
            type: 'SELECT',
            required: true,
            options: JSON.stringify([
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
              { value: 'gray', label: 'Gray' },
              { value: 'pink', label: 'Pink' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'orange', label: 'Orange' },
              { value: 'purple', label: 'Purple' }
            ]),
            aiExtractable: true,
            aiWeight: 1.0,
            aiPromptHint: 'Identify the dominant/primary color of the garment',
            sortOrder: 1
          },
          {
            key: 'material',
            label: 'Material',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'cotton', label: 'Cotton' },
              { value: 'polyester', label: 'Polyester' },
              { value: 'silk', label: 'Silk' },
              { value: 'linen', label: 'Linen' },
              { value: 'wool', label: 'Wool' },
              { value: 'blend', label: 'Blend/Mixed' }
            ]),
            aiExtractable: true,
            aiWeight: 0.7,
            aiPromptHint: 'Determine fabric material based on texture and appearance',
            sortOrder: 2
          },
          {
            key: 'sleeve_length',
            label: 'Sleeve Length',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'sleeveless', label: 'Sleeveless' },
              { value: 'short', label: 'Short Sleeve' },
              { value: 'three_quarter', label: '3/4 Sleeve' },
              { value: 'long', label: 'Long Sleeve' }
            ]),
            aiExtractable: true,
            aiWeight: 0.9,
            aiPromptHint: 'Identify the length of the sleeves',
            sortOrder: 3
          },
          {
            key: 'neckline',
            label: 'Neckline Style',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'round', label: 'Round/Crew Neck' },
              { value: 'v_neck', label: 'V-Neck' },
              { value: 'collar', label: 'Collar' },
              { value: 'scoop', label: 'Scoop Neck' },
              { value: 'high_neck', label: 'High Neck' },
              { value: 'off_shoulder', label: 'Off Shoulder' }
            ]),
            aiExtractable: true,
            aiWeight: 0.8,
            aiPromptHint: 'Identify the neckline design and style',
            sortOrder: 4
          },
          {
            key: 'pattern',
            label: 'Pattern',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'solid', label: 'Solid Color' },
              { value: 'striped', label: 'Striped' },
              { value: 'polka_dot', label: 'Polka Dot' },
              { value: 'floral', label: 'Floral' },
              { value: 'geometric', label: 'Geometric' },
              { value: 'abstract', label: 'Abstract' },
              { value: 'plaid', label: 'Plaid/Checkered' }
            ]),
            aiExtractable: true,
            aiWeight: 0.8,
            aiPromptHint: 'Identify any patterns or prints on the garment',
            sortOrder: 5
          }
        ]
      }
    },
  })

  // Create Pants category
  const pantsCategory = await prisma.category.upsert({
    where: { name: 'Pants & Bottoms' },
    update: {},
    create: {
      name: 'Pants & Bottoms',
      description: 'Jeans, trousers, shorts, and casual bottoms',
      aiPromptTemplate: 'Analyze this pants/bottoms image and extract the following attributes with high accuracy. Focus on clearly visible features only.',
      sortOrder: 2,
      attributes: {
        create: [
          {
            key: 'color',
            label: 'Primary Color',
            type: 'SELECT',
            required: true,
            options: JSON.stringify([
              { value: 'blue', label: 'Blue' },
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
              { value: 'gray', label: 'Gray' },
              { value: 'brown', label: 'Brown' },
              { value: 'khaki', label: 'Khaki' },
              { value: 'navy', label: 'Navy' },
              { value: 'olive', label: 'Olive' }
            ]),
            aiExtractable: true,
            aiWeight: 1.0,
            aiPromptHint: 'Identify the dominant/primary color of the pants',
            sortOrder: 1
          },
          {
            key: 'material',
            label: 'Material',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'denim', label: 'Denim' },
              { value: 'cotton', label: 'Cotton' },
              { value: 'polyester', label: 'Polyester' },
              { value: 'linen', label: 'Linen' },
              { value: 'wool', label: 'Wool' },
              { value: 'stretch', label: 'Stretch/Elastic' }
            ]),
            aiExtractable: true,
            aiWeight: 0.8,
            aiPromptHint: 'Determine fabric material based on texture and appearance',
            sortOrder: 2
          },
          {
            key: 'fit',
            label: 'Fit Style',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'skinny', label: 'Skinny' },
              { value: 'slim', label: 'Slim' },
              { value: 'regular', label: 'Regular' },
              { value: 'loose', label: 'Loose' },
              { value: 'wide_leg', label: 'Wide Leg' },
              { value: 'bootcut', label: 'Bootcut' }
            ]),
            aiExtractable: true,
            aiWeight: 0.7,
            aiPromptHint: 'Identify the fit and silhouette of the pants',
            sortOrder: 3
          },
          {
            key: 'length',
            label: 'Length',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'full_length', label: 'Full Length' },
              { value: 'cropped', label: 'Cropped' },
              { value: 'shorts', label: 'Shorts' },
              { value: 'capri', label: 'Capri' },
              { value: 'bermuda', label: 'Bermuda' }
            ]),
            aiExtractable: true,
            aiWeight: 0.9,
            aiPromptHint: 'Identify the length of the garment',
            sortOrder: 4
          }
        ]
      }
    },
  })

  // Create Dresses category
  const dressesCategory = await prisma.category.upsert({
    where: { name: 'Dresses' },
    update: {},
    create: {
      name: 'Dresses',
      description: 'Casual dresses, formal gowns, and midi dresses',
      aiPromptTemplate: 'Analyze this dress image and extract the following attributes with high accuracy. Focus on clearly visible features only.',
      sortOrder: 3,
      attributes: {
        create: [
          {
            key: 'color',
            label: 'Primary Color',
            type: 'SELECT',
            required: true,
            options: JSON.stringify([
              { value: 'red', label: 'Red' },
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
              { value: 'pink', label: 'Pink' },
              { value: 'purple', label: 'Purple' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'navy', label: 'Navy' },
              { value: 'maroon', label: 'Maroon' }
            ]),
            aiExtractable: true,
            aiWeight: 1.0,
            aiPromptHint: 'Identify the dominant/primary color of the dress',
            sortOrder: 1
          },
          {
            key: 'length',
            label: 'Dress Length',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'mini', label: 'Mini' },
              { value: 'knee_length', label: 'Knee Length' },
              { value: 'midi', label: 'Midi' },
              { value: 'maxi', label: 'Maxi' },
              { value: 'floor_length', label: 'Floor Length' }
            ]),
            aiExtractable: true,
            aiWeight: 0.9,
            aiPromptHint: 'Identify the length of the dress',
            sortOrder: 2
          },
          {
            key: 'sleeve_style',
            label: 'Sleeve Style',
            type: 'SELECT',
            required: false,
            options: JSON.stringify([
              { value: 'sleeveless', label: 'Sleeveless' },
              { value: 'cap_sleeve', label: 'Cap Sleeve' },
              { value: 'short_sleeve', label: 'Short Sleeve' },
              { value: 'long_sleeve', label: 'Long Sleeve' },
              { value: 'off_shoulder', label: 'Off Shoulder' }
            ]),
            aiExtractable: true,
            aiWeight: 0.8,
            aiPromptHint: 'Identify the sleeve style of the dress',
            sortOrder: 3
          }
        ]
      }
    },
  })

  console.log('Database seeded successfully!')
  console.log({ shirtsCategory, pantsCategory, dressesCategory })
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
