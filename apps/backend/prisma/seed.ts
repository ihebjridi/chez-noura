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
  const chorba = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Chorba',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Chorba',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Chorba');

  const chorbaLentilles = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Chorba Lentilles',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Chorba Lentilles',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Chorba Lentilles');

  const chorbaPotiron = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupComponent.id,
        name: 'Chorba Potiron',
      },
    },
    update: {},
    create: {
      componentId: soupComponent.id,
      name: 'Chorba Potiron',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Chorba Potiron');

  // Create Variants for Main Course
  console.log('\nCreating Variants for Main Course...');
  const brik = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Brik',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Brik',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Brik');

  const couscousViande = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Couscous Viande',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Couscous Viande',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Couscous Viande');

  const croquette = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Croquette',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Croquette',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Croquette');

  const ojjaMerguez = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Ojja Merguez',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Ojja Merguez',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Ojja Merguez');

  const rizLegumes = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Riz Légumes',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Riz Légumes',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Riz Légumes');

  const tajine = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: mainCourseComponent.id,
        name: 'Tajine',
      },
    },
    update: {},
    create: {
      componentId: mainCourseComponent.id,
      name: 'Tajine',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Tajine');

  // Create Variants for Dessert
  console.log('\nCreating Variants for Dessert...');
  const zlebya = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Zlebya',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Zlebya',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Zlebya');

  // Create Variants for Beverage
  console.log('\nCreating Variants for Beverage...');
  // No beverage images in variant-images directory

  // Create Variants for Salad
  console.log('\nCreating Variants for Salad...');
  const saladeMechoueya = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Salade Mechoueya',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Salade Mechoueya',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Salade Mechoueya');

  const saladePatates = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Salade Patates',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Salade Patates',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Salade Patates');

  const saladeTunisienne = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladComponent.id,
        name: 'Salade Tunisienne',
      },
    },
    update: {},
    create: {
      componentId: saladComponent.id,
      name: 'Salade Tunisienne',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant created: Salade Tunisienne');

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
  console.log('  Soup: Chorba, Chorba Lentilles, Chorba Potiron');
  console.log('  Main Course: Brik, Couscous Viande, Croquette, Ojja Merguez, Riz Légumes, Tajine');
  console.log('  Dessert: Zlebya');
  console.log('  Beverage: (none)');
  console.log('  Salad: Salade Mechoueya, Salade Patates, Salade Tunisienne');
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
