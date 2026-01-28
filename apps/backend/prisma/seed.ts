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

  // Create Packs for Rupture de Jeune
  console.log('\nCreating Packs for Rupture de Jeune...');
  const ruptureDeJeuneBasicPack = await prisma.pack.upsert({
    where: { name: 'Rupture de Jeune Basic Pack' },
    update: {},
    create: {
      name: 'Rupture de Jeune Basic Pack',
      price: 22.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Rupture de Jeune Basic Pack');

  const ruptureDeJeunePremiumPack = await prisma.pack.upsert({
    where: { name: 'Rupture de Jeune Premium Pack' },
    update: {},
    create: {
      name: 'Rupture de Jeune Premium Pack',
      price: 30.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Rupture de Jeune Premium Pack');

  // Create PackComponents for Rupture de Jeune Basic Pack
  console.log('\nCreating PackComponents for Rupture de Jeune Basic Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeuneBasicPack.id,
        componentId: soupComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeuneBasicPack.id,
      componentId: soupComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Basic Pack - Soup (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeuneBasicPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeuneBasicPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Basic Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeuneBasicPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeuneBasicPack.id,
      componentId: dessertComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Basic Pack - Dessert (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeuneBasicPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeuneBasicPack.id,
      componentId: beverageComponent.id,
      required: false,
      orderIndex: 3,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Basic Pack - Beverage (optional)');

  // Create PackComponents for Rupture de Jeune Premium Pack
  console.log('\nCreating PackComponents for Rupture de Jeune Premium Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeunePremiumPack.id,
        componentId: soupComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeunePremiumPack.id,
      componentId: soupComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Premium Pack - Soup (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeunePremiumPack.id,
        componentId: saladComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeunePremiumPack.id,
      componentId: saladComponent.id,
      required: true,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Premium Pack - Salad (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeunePremiumPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeunePremiumPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Premium Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeunePremiumPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeunePremiumPack.id,
      componentId: dessertComponent.id,
      required: true,
      orderIndex: 3,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Premium Pack - Dessert (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureDeJeunePremiumPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureDeJeunePremiumPack.id,
      componentId: beverageComponent.id,
      required: true,
      orderIndex: 4,
    },
  });
  console.log('✅ PackComponent created: Rupture de Jeune Premium Pack - Beverage (required)');

  // Create Packs for Collation
  console.log('\nCreating Packs for Collation...');
  const collationBasicPack = await prisma.pack.upsert({
    where: { name: 'Collation Basic Pack' },
    update: {},
    create: {
      name: 'Collation Basic Pack',
      price: 15.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Collation Basic Pack');

  const collationPremiumPack = await prisma.pack.upsert({
    where: { name: 'Collation Premium Pack' },
    update: {},
    create: {
      name: 'Collation Premium Pack',
      price: 20.00,
      isActive: true,
    },
  });
  console.log('✅ Pack created: Collation Premium Pack');

  // Create PackComponents for Collation Basic Pack
  console.log('\nCreating PackComponents for Collation Basic Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Collation Basic Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: beverageComponent.id,
      required: false,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Collation Basic Pack - Beverage (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: dessertComponent.id,
      required: false,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Collation Basic Pack - Dessert (optional)');

  // Create PackComponents for Collation Premium Pack
  console.log('\nCreating PackComponents for Collation Premium Pack...');
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationPremiumPack.id,
        componentId: mainCourseComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationPremiumPack.id,
      componentId: mainCourseComponent.id,
      required: true,
      orderIndex: 0,
    },
  });
  console.log('✅ PackComponent created: Collation Premium Pack - Main Course (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationPremiumPack.id,
        componentId: beverageComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationPremiumPack.id,
      componentId: beverageComponent.id,
      required: true,
      orderIndex: 1,
    },
  });
  console.log('✅ PackComponent created: Collation Premium Pack - Beverage (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationPremiumPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationPremiumPack.id,
      componentId: dessertComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  console.log('✅ PackComponent created: Collation Premium Pack - Dessert (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationPremiumPack.id,
        componentId: saladComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationPremiumPack.id,
      componentId: saladComponent.id,
      required: false,
      orderIndex: 3,
    },
  });
  console.log('✅ PackComponent created: Collation Premium Pack - Salad (optional)');

  // Create Services
  console.log('\nCreating Services...');
  const dejeunerService = await prisma.service.upsert({
    where: { name: 'Dejeuner' },
    update: {},
    create: {
      name: 'Dejeuner',
      description: 'Lunch service',
      isActive: true,
    },
  });
  console.log('✅ Service created: Dejeuner');

  const petitDejeunerService = await prisma.service.upsert({
    where: { name: 'Petit Dejeuner' },
    update: {},
    create: {
      name: 'Petit Dejeuner',
      description: 'Breakfast service',
      isActive: true,
    },
  });
  console.log('✅ Service created: Petit Dejeuner');

  const dinerService = await prisma.service.upsert({
    where: { name: 'Diner' },
    update: {},
    create: {
      name: 'Diner',
      description: 'Dinner service',
      isActive: true,
    },
  });
  console.log('✅ Service created: Diner');

  const ruptureDeJeuneService = await prisma.service.upsert({
    where: { name: 'Rupture de Jeune' },
    update: {},
    create: {
      name: 'Rupture de Jeune',
      description: 'Iftar service for Ramadan',
      isActive: true,
    },
  });
  console.log('✅ Service created: Rupture de Jeune');

  const collationService = await prisma.service.upsert({
    where: { name: 'Collation' },
    update: {},
    create: {
      name: 'Collation',
      description: 'Snack service for Ramadan',
      isActive: true,
    },
  });
  console.log('✅ Service created: Collation');

  // Assign packs to services
  console.log('\nAssigning packs to services...');
  await prisma.servicePack.upsert({
    where: { packId: standardPack.id },
    update: {},
    create: {
      serviceId: dejeunerService.id,
      packId: standardPack.id,
    },
  });
  console.log('✅ Assigned Standard Pack to Dejeuner service');

  await prisma.servicePack.upsert({
    where: { packId: premiumPack.id },
    update: {},
    create: {
      serviceId: dejeunerService.id,
      packId: premiumPack.id,
    },
  });
  console.log('✅ Assigned Premium Pack to Dejeuner service');

  await prisma.servicePack.upsert({
    where: { packId: ruptureDeJeuneBasicPack.id },
    update: {},
    create: {
      serviceId: ruptureDeJeuneService.id,
      packId: ruptureDeJeuneBasicPack.id,
    },
  });
  console.log('✅ Assigned Rupture de Jeune Basic Pack to Rupture de Jeune service');

  await prisma.servicePack.upsert({
    where: { packId: ruptureDeJeunePremiumPack.id },
    update: {},
    create: {
      serviceId: ruptureDeJeuneService.id,
      packId: ruptureDeJeunePremiumPack.id,
    },
  });
  console.log('✅ Assigned Rupture de Jeune Premium Pack to Rupture de Jeune service');

  await prisma.servicePack.upsert({
    where: { packId: collationBasicPack.id },
    update: {},
    create: {
      serviceId: collationService.id,
      packId: collationBasicPack.id,
    },
  });
  console.log('✅ Assigned Collation Basic Pack to Collation service');

  await prisma.servicePack.upsert({
    where: { packId: collationPremiumPack.id },
    update: {},
    create: {
      serviceId: collationService.id,
      packId: collationPremiumPack.id,
    },
  });
  console.log('✅ Assigned Collation Premium Pack to Collation service');

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
  console.log('  - Standard Pack (25.00 TND) → Dejeuner');
  console.log('  - Premium Pack (35.00 TND) → Dejeuner');
  console.log('  - Rupture de Jeune Basic Pack (22.00 TND) → Rupture de Jeune');
  console.log('  - Rupture de Jeune Premium Pack (30.00 TND) → Rupture de Jeune');
  console.log('  - Collation Basic Pack (15.00 TND) → Collation');
  console.log('  - Collation Premium Pack (20.00 TND) → Collation');
  console.log('\nSERVICES:');
  console.log('  - Dejeuner (Lunch service)');
  console.log('  - Petit Dejeuner (Breakfast service)');
  console.log('  - Diner (Dinner service)');
  console.log('  - Rupture de Jeune (Iftar service for Ramadan)');
  console.log('  - Collation (Snack service for Ramadan)');
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
