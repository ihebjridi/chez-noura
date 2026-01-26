import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";



const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for super admin
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create SUPER_ADMIN user
  console.log('Creating SUPER_ADMIN user...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cheznoura.tn' },
    update: {},
    create: {
      email: 'admin@cheznoura.tn',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log('✅ SUPER_ADMIN created:', superAdmin.email);

  // Create Components
  console.log('\nCreating Components...');
  const soupComponent = await prisma.component.upsert({
    where: { name: 'Soup' },
    update: {},
    create: { name: 'Soup' },
  });
  console.log('✅ Component created: Soup');

  const mainCourseComponent = await prisma.component.upsert({
    where: { name: 'Main Course' },
    update: {},
    create: { name: 'Main Course' },
  });
  console.log('✅ Component created: Main Course');

  const dessertComponent = await prisma.component.upsert({
    where: { name: 'Dessert' },
    update: {},
    create: { name: 'Dessert' },
  });
  console.log('✅ Component created: Dessert');

  const beverageComponent = await prisma.component.upsert({
    where: { name: 'Beverage' },
    update: {},
    create: { name: 'Beverage' },
  });
  console.log('✅ Component created: Beverage');

  const saladComponent = await prisma.component.upsert({
    where: { name: 'Salad' },
    update: {},
    create: { name: 'Salad' },
  });
  console.log('✅ Component created: Salad');

  // Create Variants for Soup
  console.log('\nCreating Variants for Soup...');
  const lentilSoup = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Lentil Soup',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Lentil Soup',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Lentil Soup');

  const chickenSoup = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Chicken Soup',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Chicken Soup',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Chicken Soup');

  const vegetableSoup = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Vegetable Soup',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Vegetable Soup',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Vegetable Soup');

  // Create Variants for Main Course
  console.log('\nCreating Variants for Main Course...');
  const grilledChicken = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Grilled Chicken',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Grilled Chicken',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Grilled Chicken');

  const beefSteak = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Beef Steak',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Beef Steak',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Beef Steak');

  const fishFillet = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Fish Fillet',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Fish Fillet',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Fish Fillet');

  const vegetarianOption = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Vegetarian Option',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Vegetarian Option',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Vegetarian Option');

  // Create Variants for Dessert
  console.log('\nCreating Variants for Dessert...');
  const baklava = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Baklava',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Baklava',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Baklava');

  const kunafa = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Kunafa',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Kunafa',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Kunafa');

  const fruitSalad = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Fruit Salad',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Fruit Salad',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Fruit Salad');

  // Create Variants for Beverage
  console.log('\nCreating Variants for Beverage...');
  const orangeJuice = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: beverageComponent.id,
        name: 'Orange Juice',
      },
    },
    update: {},
    create: {
      componentId: beverageComponent.id,
      name: 'Orange Juice',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Orange Juice');

  const lemonade = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: beverageComponent.id,
        name: 'Lemonade',
      },
    },
    update: {},
    create: {
      componentId: beverageComponent.id,
      name: 'Lemonade',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Lemonade');

  const water = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: beverageComponent.id,
        name: 'Water',
      },
    },
    update: {},
    create: {
      componentId: beverageComponent.id,
      name: 'Water',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Water');

  // Create Variants for Salad
  console.log('\nCreating Variants for Salad...');
  const greenSalad = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Green Salad',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Green Salad',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Green Salad');

  const fattoush = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Fattoush',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Fattoush',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Fattoush');

  const tabbouleh = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Tabbouleh',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Tabbouleh',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Tabbouleh');

  // Create Packs
  console.log('\nCreating Packs...');
  const standardPack = await prisma.pack.upsert({
    where: { name: 'Standard Pack' },
    update: {},
    create: {
      name: 'Standard Pack',
      price: 25.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Standard Pack');

  const premiumPack = await prisma.pack.upsert({
    where: { name: 'Premium Pack' },
    update: {},
    create: {
      name: 'Premium Pack',
      price: 35.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Premium Pack');

  // Create PackComponents for Standard Pack
  console.log('\nCreating PackComponents for Standard Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: standardPack.id,
        componentId: soupComponent.id,
      },
    },
    update: {},
    create: {
      packId: standardPack.id,
      componentId: soupComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Standard Pack - Soup (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: standardPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: standardPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Standard Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: standardPack.id,
        componentId: saladComponent.id,
      },
    },
    update: {},
    create: {
      packId: standardPack.id,
      componentId: saladComponent.id,
      required: false,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Standard Pack - Salad (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: standardPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: standardPack.id,
      componentId: dessertComponent.id,
      required: true,
      orderIndex: 3,
    },
  });
  console.log('✅ PackComponent created: Standard Pack - Dessert (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: standardPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: standardPack.id,
      componentId: beverageComponent.id,
      required: false,
      orderIndex: 4,
    },
  });
  console.log('✅ PackComponent created: Standard Pack - Beverage (optional)');

  // Create PackComponents for Premium Pack
  console.log('\nCreating PackComponents for Premium Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: premiumPack.id,
        componentId: soupComponent.id,
      },
    },
    update: {},
    create: {
      packId: premiumPack.id,
      componentId: soupComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Premium Pack - Soup (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: premiumPack.id,
        componentId: saladComponent.id,
      },
    },
    update: {},
    create: {
      packId: premiumPack.id,
      componentId: saladComponent.id,
      required: true,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Premium Pack - Salad (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: premiumPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: premiumPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Premium Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: premiumPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: premiumPack.id,
      componentId: dessertComponent.id,
      required: true,
      orderIndex: 3,
    },
  });
  console.log('✅ PackComponent created: Premium Pack - Dessert (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: premiumPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: premiumPack.id,
      componentId: beverageComponent.id,
      required: true,
      orderIndex: 4,
    },
  });
  console.log('✅ PackComponent created: Premium Pack - Beverage (required)');

  console.log('\n📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUPER_ADMIN:');
  console.log(`  Email: admin@cheznoura.tn`);
  console.log(`  Password: password123`);
  console.log('\nCOMPONENTS:');
  console.log('  - Soup');
  console.log('  - Main Course');
  console.log('  - Dessert');
  console.log('  - Beverage');
  console.log('  - Salad');
  console.log('\nVARIANTS:');
  console.log('  Soup: Lentil Soup, Chicken Soup, Vegetable Soup');
  console.log('  Main Course: Grilled Chicken, Beef Steak, Fish Fillet, Vegetarian Option');
  console.log('  Dessert: Baklava, Kunafa, Fruit Salad');
  console.log('  Beverage: Orange Juice, Lemonade, Water');
  console.log('  Salad: Green Salad, Fattoush, Tabbouleh');
  console.log('\nPACKS:');
  console.log('  - Standard Pack (25.00 TND)');
  console.log('  - Premium Pack (35.00 TND)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
