import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// STATIC DATA DEFINITIONS
// ============================================================================

const COMPONENT_NAMES = [
  'Fruits',
  'Boisson',
  'Douceur du Ramadan',
  'Soupe',
  'Plat Principal',
  'Salade',
  'Spécialité Tunisienne',
  'Dessert',
] as const;

const VARIANTS = [
  // Fruits variants
  { componentName: 'Fruits', name: 'Dattes Deglet Nour', stockQuantity: 100 },
  { componentName: 'Fruits', name: 'Dattes Farcies', stockQuantity: 100 },
  { componentName: 'Fruits', name: 'Fruits de Saison', stockQuantity: 100 },
  { componentName: 'Fruits', name: 'Salade de Fruits', stockQuantity: 100 },
  
  // Boisson variants
  { componentName: 'Boisson', name: 'Eau Minérale', stockQuantity: 100 },
  { componentName: 'Boisson', name: 'Eau Plate', stockQuantity: 100 },
  
  // Douceur du Ramadan variants
  { componentName: 'Douceur du Ramadan', name: 'Dro3 Tunisien', stockQuantity: 100 },
  { componentName: 'Douceur du Ramadan', name: 'Masfouf aux Dattes', stockQuantity: 100 },
  { componentName: 'Douceur du Ramadan', name: 'Morceau de Gâteau Maison', stockQuantity: 100 },
  { componentName: 'Douceur du Ramadan', name: 'Crème Dessert à la Fleur d\'Oranger', stockQuantity: 100 },
  { componentName: 'Douceur du Ramadan', name: 'Crème Vanille Maison', stockQuantity: 100 },
  { componentName: 'Douceur du Ramadan', name: 'Riz au Lait Tunisien', stockQuantity: 100 },
  
  // Soupe variants
  { componentName: 'Soupe', name: 'Chorba Frik Tunisienne', stockQuantity: 100 },
  { componentName: 'Soupe', name: 'Soupe de Lentilles', stockQuantity: 100 },
  { componentName: 'Soupe', name: 'Soupe de Pois Chiches', stockQuantity: 100 },
  { componentName: 'Soupe', name: 'Velouté de Potiron', stockQuantity: 100 },
  
  // Plat Principal variants
  { componentName: 'Plat Principal', name: 'Couscous Poulet', stockQuantity: 100 },
  { componentName: 'Plat Principal', name: 'Couscous Agneau', stockQuantity: 100 },
  { componentName: 'Plat Principal', name: 'Riz Tunisien aux Épices', stockQuantity: 100 },
  { componentName: 'Plat Principal', name: 'Pâtes Tunisiennes à la Sauce Rouge', stockQuantity: 100 },
  { componentName: 'Plat Principal', name: 'Ojja Merguez', stockQuantity: 100 },
  { componentName: 'Plat Principal', name: 'Poulet Mqualli', stockQuantity: 100 },
  
  // Salade variants
  { componentName: 'Salade', name: 'Salade Mechouia', stockQuantity: 100 },
  { componentName: 'Salade', name: 'Salade Tunisienne', stockQuantity: 100 },
  { componentName: 'Salade', name: 'Salade de Pommes de Terre', stockQuantity: 100 },
  { componentName: 'Salade', name: 'Salade de Carottes au Cumin', stockQuantity: 100 },
  
  // Spécialité Tunisienne variants
  { componentName: 'Spécialité Tunisienne', name: 'Brik à l\'Œuf', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Brik Thon', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Brik Danouni', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Tajine Poulet', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Tajine Thon', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Tajine Viande', stockQuantity: 100 },
  { componentName: 'Spécialité Tunisienne', name: 'Boulette de Viande Épicée', stockQuantity: 100 },
  
  // Dessert variants
  { componentName: 'Dessert', name: 'Bambalouni Tunisien', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Zlebia Tunisienne', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Mkharek au Miel', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Baklawa Tunisienne', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Cake Maison aux Dattes', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Fruits Frais de Saison', stockQuantity: 100 },
  { componentName: 'Dessert', name: 'Assortiment de Pâtisseries Tunisiennes', stockQuantity: 100 },
] as const;

const PACKS = [
  { name: 'Basic Pack', price: 15.00 },
  { name: 'Basic', price: 22.00 },
  { name: 'Basic+', price: 28.00 },
  { name: 'Premium', price: 35.00 },
] as const;

const PACK_COMPONENTS = [
  // Collation Basic Pack
  { packName: 'Basic Pack', componentName: 'Fruits', required: false, orderIndex: 0 },
  { packName: 'Basic Pack', componentName: 'Boisson', required: false, orderIndex: 1 },
  { packName: 'Basic Pack', componentName: 'Douceur du Ramadan', required: false, orderIndex: 2 },
  
  // Rupture Basic Pack
  { packName: 'Basic', componentName: 'Boisson', required: false, orderIndex: 0 },
  { packName: 'Basic', componentName: 'Soupe', required: false, orderIndex: 1 },
  { packName: 'Basic', componentName: 'Plat Principal', required: true, orderIndex: 2 },
  { packName: 'Basic', componentName: 'Salade', required: false, orderIndex: 3 },
  
  // Rupture Basic+ Pack
  { packName: 'Basic+', componentName: 'Boisson', required: false, orderIndex: 0 },
  { packName: 'Basic+', componentName: 'Soupe', required: false, orderIndex: 1 },
  { packName: 'Basic+', componentName: 'Plat Principal', required: true, orderIndex: 2 },
  { packName: 'Basic+', componentName: 'Salade', required: false, orderIndex: 3 },
  { packName: 'Basic+', componentName: 'Spécialité Tunisienne', required: false, orderIndex: 4 },
  
  // Rupture Premium Pack
  { packName: 'Premium', componentName: 'Boisson', required: false, orderIndex: 0 },
  { packName: 'Premium', componentName: 'Soupe', required: false, orderIndex: 1 },
  { packName: 'Premium', componentName: 'Plat Principal', required: true, orderIndex: 2 },
  { packName: 'Premium', componentName: 'Salade', required: false, orderIndex: 3 },
  { packName: 'Premium', componentName: 'Spécialité Tunisienne', required: false, orderIndex: 4 },
  { packName: 'Premium', componentName: 'Dessert', required: false, orderIndex: 5 },
] as const;

const SERVICES = [
  {
    name: 'Collation',
    description: 'Service de collation pour le Ramadan',
    isActive: true,
    isPublished: true,
    orderStartTime: '14:00',
    cutoffTime: '16:00',
    packNames: ['Basic Pack'],
  },
  {
    name: 'Rupture de Jeûne',
    description: 'Service de rupture de jeûne pour le Ramadan',
    isActive: true,
    isPublished: true,
    orderStartTime: '16:00',
    cutoffTime: '18:00',
    packNames: ['Basic', 'Basic+', 'Premium'],
  },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function upsertComponents(componentNames: readonly string[]) {
  console.log('\n📦 Creating Components...');
  const components = await Promise.all(
    componentNames.map((name) =>
      prisma.component.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log(`✅ Created ${components.length} components`);
  return components;
}

async function upsertVariants(
  variants: readonly { componentName: string; name: string; stockQuantity: number }[],
  componentMap: Map<string, { id: string }>
) {
  console.log('\n🍎 Creating Variants...');
  const variantPromises = variants.map((variant) => {
    const component = componentMap.get(variant.componentName);
    if (!component) {
      throw new Error(`Component not found: ${variant.componentName}`);
    }
    return prisma.variant.upsert({
      where: {
        componentId_name: {
          componentId: component.id,
          name: variant.name,
        },
      },
      update: {},
      create: {
        componentId: component.id,
        name: variant.name,
        stockQuantity: variant.stockQuantity,
        isActive: true,
      },
    });
  });
  const createdVariants = await Promise.all(variantPromises);
  console.log(`✅ Created ${createdVariants.length} variants`);
  return createdVariants;
}

async function upsertPacks(packs: readonly { name: string; price: number }[]) {
  console.log('\n📦 Creating Packs...');
  const createdPacks = await Promise.all(
    packs.map((pack) =>
      prisma.pack.upsert({
        where: { name: pack.name },
        update: {},
        create: {
          name: pack.name,
          price: pack.price,
          isActive: true,
        },
      })
    )
  );
  console.log(`✅ Created ${createdPacks.length} packs`);
  return createdPacks;
}

async function upsertPackComponents(
  packComponents: readonly {
    packName: string;
    componentName: string;
    required: boolean;
    orderIndex: number;
  }[],
  packMap: Map<string, { id: string }>,
  componentMap: Map<string, { id: string }>
) {
  console.log('\n🔗 Linking Components to Packs...');
  const packComponentPromises = packComponents.map((pc) => {
    const pack = packMap.get(pc.packName);
    const component = componentMap.get(pc.componentName);
    if (!pack || !component) {
      throw new Error(`Pack or component not found: ${pc.packName} / ${pc.componentName}`);
    }
    return prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: pack.id,
          componentId: component.id,
        },
      },
      update: {},
      create: {
        packId: pack.id,
        componentId: component.id,
        required: pc.required,
        orderIndex: pc.orderIndex,
      },
    });
  });
  await Promise.all(packComponentPromises);
  console.log(`✅ Linked ${packComponents.length} components to packs`);
}

async function upsertServices(
  services: readonly {
    name: string;
    description: string;
    isActive: boolean;
    isPublished: boolean;
    orderStartTime: string;
    cutoffTime: string;
    packNames: readonly string[];
  }[],
  packMap: Map<string, { id: string }>
) {
  console.log('\n🔧 Creating Services...');
  const createdServices = await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: {
          name: service.name,
          description: service.description,
          isActive: service.isActive,
          isPublished: service.isPublished,
          orderStartTime: service.orderStartTime,
          cutoffTime: service.cutoffTime,
        },
      })
    )
  );
  console.log(`✅ Created ${createdServices.length} services`);

  // Link packs to services
  console.log('\n🔗 Linking Packs to Services...');
  const servicePackPromises: Promise<unknown>[] = [];
  services.forEach((service, index) => {
    const serviceRecord = createdServices[index];
    service.packNames.forEach((packName) => {
      const pack = packMap.get(packName);
      if (!pack) {
        throw new Error(`Pack not found: ${packName}`);
      }
      servicePackPromises.push(
        prisma.servicePack.upsert({
          where: { packId: pack.id },
          update: {},
          create: {
            serviceId: serviceRecord.id,
            packId: pack.id,
          },
        })
      );
    });
  });
  await Promise.all(servicePackPromises);
  console.log(`✅ Linked packs to services`);

  return createdServices;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for super admin
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create SUPER_ADMIN user
  console.log('\n👤 Creating SUPER_ADMIN user...');
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

  // Create components in parallel
  const components = await upsertComponents(COMPONENT_NAMES);
  const componentMap = new Map(components.map((c) => [c.name, c]));

  // Create variants in parallel
  await upsertVariants(VARIANTS, componentMap);

  // Create packs in parallel
  const packs = await upsertPacks(PACKS);
  const packMap = new Map(packs.map((p) => [p.name, p]));

  // Create pack components in parallel
  await upsertPackComponents(PACK_COMPONENTS, packMap, componentMap);

  // Create services and link packs in parallel
  await upsertServices(SERVICES, packMap);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUPER_ADMIN:');
  console.log(`  Email: admin@cheznoura.tn`);
  console.log(`  Password: password123`);
  console.log('\nSERVICES:');
  console.log('  ✅ Collation (published, 14:00-16:00)');
  console.log('    → Basic Pack (15.00 TND)');
  console.log('  ✅ Rupture de Jeûne (published, 16:00-18:00)');
  console.log('    → Basic (22.00 TND)');
  console.log('    → Basic+ (28.00 TND)');
  console.log('    → Premium (35.00 TND)');
  console.log('\nCOMPONENTS:');
  COMPONENT_NAMES.forEach((name) => {
    console.log(`  - ${name}`);
  });
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
