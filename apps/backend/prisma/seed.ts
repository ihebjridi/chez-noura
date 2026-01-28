import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

  // ============================================================================
  // COMPONENTS
  // ============================================================================
  console.log('\n📦 Creating Components...');
  
  const fruitsComponent = await prisma.component.upsert({
    where: { name: 'Fruits' },
    update: {},
    create: { name: 'Fruits' },
  });
  console.log('✅ Component: Fruits');

  const boissonComponent = await prisma.component.upsert({
    where: { name: 'Boisson' },
    update: {},
    create: { name: 'Boisson' },
  });
  console.log('✅ Component: Boisson');

  const douceurRamadanComponent = await prisma.component.upsert({
    where: { name: 'Douceur du Ramadan' },
    update: {},
    create: { name: 'Douceur du Ramadan' },
  });
  console.log('✅ Component: Douceur du Ramadan');

  const soupeComponent = await prisma.component.upsert({
    where: { name: 'Soupe' },
    update: {},
    create: { name: 'Soupe' },
  });
  console.log('✅ Component: Soupe');

  const platPrincipalComponent = await prisma.component.upsert({
    where: { name: 'Plat Principal' },
    update: {},
    create: { name: 'Plat Principal' },
  });
  console.log('✅ Component: Plat Principal');

  const saladeComponent = await prisma.component.upsert({
    where: { name: 'Salade' },
    update: {},
    create: { name: 'Salade' },
  });
  console.log('✅ Component: Salade');

  const specialiteTunisienneComponent = await prisma.component.upsert({
    where: { name: 'Spécialité Tunisienne' },
    update: {},
    create: { name: 'Spécialité Tunisienne' },
  });
  console.log('✅ Component: Spécialité Tunisienne');

  const dessertComponent = await prisma.component.upsert({
    where: { name: 'Dessert' },
    update: {},
    create: { name: 'Dessert' },
  });
  console.log('✅ Component: Dessert');

  // ============================================================================
  // VARIANTS - COLLATION SERVICE
  // ============================================================================
  console.log('\n🍎 Creating Variants for Collation Service...');

  // Fruits variants
  const dattesDegletNour = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: fruitsComponent.id,
        name: 'Dattes Deglet Nour',
      },
    },
    update: {},
    create: {
      componentId: fruitsComponent.id,
      name: 'Dattes Deglet Nour',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Dattes Deglet Nour');

  const dattesFarcies = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: fruitsComponent.id,
        name: 'Dattes Farcies',
      },
    },
    update: {},
    create: {
      componentId: fruitsComponent.id,
      name: 'Dattes Farcies',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Dattes Farcies');

  const fruitsSaison = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: fruitsComponent.id,
        name: 'Fruits de Saison',
      },
    },
    update: {},
    create: {
      componentId: fruitsComponent.id,
      name: 'Fruits de Saison',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Fruits de Saison');

  const saladeFruits = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: fruitsComponent.id,
        name: 'Salade de Fruits',
      },
    },
    update: {},
    create: {
      componentId: fruitsComponent.id,
      name: 'Salade de Fruits',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Salade de Fruits');

  // Boisson variants
  const eauMinerale = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: boissonComponent.id,
        name: 'Eau Minérale',
      },
    },
    update: {},
    create: {
      componentId: boissonComponent.id,
      name: 'Eau Minérale',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Eau Minérale');

  const eauPlate = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: boissonComponent.id,
        name: 'Eau Plate',
      },
    },
    update: {},
    create: {
      componentId: boissonComponent.id,
      name: 'Eau Plate',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Eau Plate');

  // Douceur du Ramadan variants
  const dro3Tunisien = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Dro3 Tunisien',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Dro3 Tunisien',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Dro3 Tunisien');

  const masfoufDattes = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Masfouf aux Dattes',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Masfouf aux Dattes',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Masfouf aux Dattes');

  const gateauMaison = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Morceau de Gâteau Maison',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Morceau de Gâteau Maison',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Morceau de Gâteau Maison');

  const cremeFleurOranger = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Crème Dessert à la Fleur d\'Oranger',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Crème Dessert à la Fleur d\'Oranger',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Crème Dessert à la Fleur d\'Oranger');

  const cremeVanille = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Crème Vanille Maison',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Crème Vanille Maison',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Crème Vanille Maison');

  const rizLaitTunisien = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: douceurRamadanComponent.id,
        name: 'Riz au Lait Tunisien',
      },
    },
    update: {},
    create: {
      componentId: douceurRamadanComponent.id,
      name: 'Riz au Lait Tunisien',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Riz au Lait Tunisien');

  // ============================================================================
  // VARIANTS - RUPTURE DE JEÛNE SERVICE
  // ============================================================================
  console.log('\n🍲 Creating Variants for Rupture de Jeûne Service...');

  // Soupe variants
  const chorbaFrik = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupeComponent.id,
        name: 'Chorba Frik Tunisienne',
      },
    },
    update: {},
    create: {
      componentId: soupeComponent.id,
      name: 'Chorba Frik Tunisienne',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Chorba Frik Tunisienne');

  const soupeLentilles = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupeComponent.id,
        name: 'Soupe de Lentilles',
      },
    },
    update: {},
    create: {
      componentId: soupeComponent.id,
      name: 'Soupe de Lentilles',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Soupe de Lentilles');

  const soupePoisChiches = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupeComponent.id,
        name: 'Soupe de Pois Chiches',
      },
    },
    update: {},
    create: {
      componentId: soupeComponent.id,
      name: 'Soupe de Pois Chiches',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Soupe de Pois Chiches');

  const veloutePotiron = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: soupeComponent.id,
        name: 'Velouté de Potiron',
      },
    },
    update: {},
    create: {
      componentId: soupeComponent.id,
      name: 'Velouté de Potiron',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Velouté de Potiron');

  // Plat Principal variants
  const couscousPoulet = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Couscous Poulet',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Couscous Poulet',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Couscous Poulet');

  const couscousAgneau = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Couscous Agneau',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Couscous Agneau',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Couscous Agneau');

  const rizTunisienEpices = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Riz Tunisien aux Épices',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Riz Tunisien aux Épices',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Riz Tunisien aux Épices');

  const patesTunisiennes = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Pâtes Tunisiennes à la Sauce Rouge',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Pâtes Tunisiennes à la Sauce Rouge',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Pâtes Tunisiennes à la Sauce Rouge');

  const ojjaMerguez = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Ojja Merguez',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Ojja Merguez',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Ojja Merguez');

  const pouletMqualli = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: platPrincipalComponent.id,
        name: 'Poulet Mqualli',
      },
    },
    update: {},
    create: {
      componentId: platPrincipalComponent.id,
      name: 'Poulet Mqualli',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Poulet Mqualli');

  // Salade variants
  const saladeMechouia = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladeComponent.id,
        name: 'Salade Mechouia',
      },
    },
    update: {},
    create: {
      componentId: saladeComponent.id,
      name: 'Salade Mechouia',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Salade Mechouia');

  const saladeTunisienne = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladeComponent.id,
        name: 'Salade Tunisienne',
      },
    },
    update: {},
    create: {
      componentId: saladeComponent.id,
      name: 'Salade Tunisienne',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Salade Tunisienne');

  const saladePommesTerre = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladeComponent.id,
        name: 'Salade de Pommes de Terre',
      },
    },
    update: {},
    create: {
      componentId: saladeComponent.id,
      name: 'Salade de Pommes de Terre',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Salade de Pommes de Terre');

  const saladeCarottesCumin = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: saladeComponent.id,
        name: 'Salade de Carottes au Cumin',
      },
    },
    update: {},
    create: {
      componentId: saladeComponent.id,
      name: 'Salade de Carottes au Cumin',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Salade de Carottes au Cumin');

  // Spécialité Tunisienne variants
  const brikOeuf = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Brik à l\'Œuf',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Brik à l\'Œuf',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Brik à l\'Œuf');

  const brikThon = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Brik Thon',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Brik Thon',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Brik Thon');

  const brikDanouni = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Brik Danouni',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Brik Danouni',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Brik Danouni');

  const tajinePoulet = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Tajine Poulet',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Tajine Poulet',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Tajine Poulet');

  const tajineThon = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Tajine Thon',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Tajine Thon',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Tajine Thon');

  const tajineViande = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Tajine Viande',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Tajine Viande',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Tajine Viande');

  const bouletteViandeEpicee = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: specialiteTunisienneComponent.id,
        name: 'Boulette de Viande Épicée',
      },
    },
    update: {},
    create: {
      componentId: specialiteTunisienneComponent.id,
      name: 'Boulette de Viande Épicée',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Boulette de Viande Épicée');

  // Dessert variants
  const bambalouni = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Bambalouni Tunisien',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Bambalouni Tunisien',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Bambalouni Tunisien');

  const zlebia = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Zlebia Tunisienne',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Zlebia Tunisienne',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Zlebia Tunisienne');

  const mkharekMiel = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Mkharek au Miel',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Mkharek au Miel',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Mkharek au Miel');

  const baklawa = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Baklawa Tunisienne',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Baklawa Tunisienne',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Baklawa Tunisienne');

  const cakeDattes = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Cake Maison aux Dattes',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Cake Maison aux Dattes',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Cake Maison aux Dattes');

  const fruitsFraisSaison = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Fruits Frais de Saison',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Fruits Frais de Saison',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Fruits Frais de Saison');

  const assortimentPatisseries = await prisma.variant.upsert({
    where: {
      componentId_name: {
        componentId: dessertComponent.id,
        name: 'Assortiment de Pâtisseries Tunisiennes',
      },
    },
    update: {},
    create: {
      componentId: dessertComponent.id,
      name: 'Assortiment de Pâtisseries Tunisiennes',
      stockQuantity: 100,
      isActive: true,
    },
  });
  console.log('✅ Variant: Assortiment de Pâtisseries Tunisiennes');

  // ============================================================================
  // PACKS - COLLATION SERVICE
  // ============================================================================
  console.log('\n📦 Creating Packs for Collation Service...');

  const collationBasicPack = await prisma.pack.upsert({
    where: { name: 'Basic Pack' },
    update: {},
    create: {
      name: 'Basic Pack',
      price: 15.00,
      isActive: true,
    },
  });
  console.log('✅ Pack: Basic Pack (15.00 TND)');

  // PackComponents for Collation Basic Pack
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: fruitsComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: fruitsComponent.id,
      required: false,
      orderIndex: 0,
    },
  });
  console.log('  → Component: Fruits (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: boissonComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: boissonComponent.id,
      required: false,
      orderIndex: 1,
    },
  });
  console.log('  → Component: Boisson (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: collationBasicPack.id,
        componentId: douceurRamadanComponent.id,
      },
    },
    update: {},
    create: {
      packId: collationBasicPack.id,
      componentId: douceurRamadanComponent.id,
      required: false,
      orderIndex: 2,
    },
  });
  console.log('  → Component: Douceur du Ramadan (optional)');

  // ============================================================================
  // PACKS - RUPTURE DE JEÛNE SERVICE
  // ============================================================================
  console.log('\n📦 Creating Packs for Rupture de Jeûne Service...');

  const ruptureBasicPack = await prisma.pack.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      price: 22.00,
      isActive: true,
    },
  });
  console.log('✅ Pack: Basic (22.00 TND)');

  const ruptureBasicPlusPack = await prisma.pack.upsert({
    where: { name: 'Basic+' },
    update: {},
    create: {
      name: 'Basic+',
      price: 28.00,
      isActive: true,
    },
  });
  console.log('✅ Pack: Basic+ (28.00 TND)');

  const rupturePremiumPack = await prisma.pack.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      price: 35.00,
      isActive: true,
    },
  });
  console.log('✅ Pack: Premium (35.00 TND)');

  // PackComponents for Rupture Basic Pack
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPack.id,
        componentId: boissonComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPack.id,
      componentId: boissonComponent.id,
      required: false,
      orderIndex: 0,
    },
  });
  console.log('  → Basic: Boisson (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPack.id,
        componentId: soupeComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPack.id,
      componentId: soupeComponent.id,
      required: false,
      orderIndex: 1,
    },
  });
  console.log('  → Basic: Soupe (optional)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPack.id,
        componentId: platPrincipalComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPack.id,
      componentId: platPrincipalComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  console.log('  → Basic: Plat Principal (required)');

  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPack.id,
        componentId: saladeComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPack.id,
      componentId: saladeComponent.id,
      required: false,
      orderIndex: 3,
    },
  });
  console.log('  → Basic: Salade (optional)');

  // PackComponents for Rupture Basic+ Pack (Basic + Spécialité Tunisienne)
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPlusPack.id,
        componentId: boissonComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPlusPack.id,
      componentId: boissonComponent.id,
      required: false,
      orderIndex: 0,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPlusPack.id,
        componentId: soupeComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPlusPack.id,
      componentId: soupeComponent.id,
      required: false,
      orderIndex: 1,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPlusPack.id,
        componentId: platPrincipalComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPlusPack.id,
      componentId: platPrincipalComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPlusPack.id,
        componentId: saladeComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPlusPack.id,
      componentId: saladeComponent.id,
      required: false,
      orderIndex: 3,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: ruptureBasicPlusPack.id,
        componentId: specialiteTunisienneComponent.id,
      },
    },
    update: {},
    create: {
      packId: ruptureBasicPlusPack.id,
      componentId: specialiteTunisienneComponent.id,
      required: false,
      orderIndex: 4,
    },
  });
  console.log('  → Basic+: All Basic components + Spécialité Tunisienne (optional)');

  // PackComponents for Rupture Premium Pack (Basic+ + Dessert)
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: boissonComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: boissonComponent.id,
      required: false,
      orderIndex: 0,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: soupeComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: soupeComponent.id,
      required: false,
      orderIndex: 1,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: platPrincipalComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: platPrincipalComponent.id,
      required: true,
      orderIndex: 2,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: saladeComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: saladeComponent.id,
      required: false,
      orderIndex: 3,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: specialiteTunisienneComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: specialiteTunisienneComponent.id,
      required: false,
      orderIndex: 4,
    },
  });
  await prisma.packComponent.upsert({
    where: {
      packId_componentId: {
        packId: rupturePremiumPack.id,
        componentId: dessertComponent.id,
      },
    },
    update: {},
    create: {
      packId: rupturePremiumPack.id,
      componentId: dessertComponent.id,
      required: false,
      orderIndex: 5,
    },
  });
  console.log('  → Premium: All Basic+ components + Dessert (optional)');

  // ============================================================================
  // SERVICES
  // ============================================================================
  console.log('\n🔧 Creating Services...');

  const collationService = await prisma.service.upsert({
    where: { name: 'Collation' },
    update: {},
    create: {
      name: 'Collation',
      description: 'Service de collation pour le Ramadan',
      isActive: true,
      isPublished: true,
      orderStartTime: '14:00',
      cutoffTime: '16:00',
    },
  });
  console.log('✅ Service: Collation (published, 14:00-16:00)');

  const ruptureJeuneService = await prisma.service.upsert({
    where: { name: 'Rupture de Jeûne' },
    update: {},
    create: {
      name: 'Rupture de Jeûne',
      description: 'Service de rupture de jeûne pour le Ramadan',
      isActive: true,
      isPublished: true,
      orderStartTime: '16:00',
      cutoffTime: '18:00',
    },
  });
  console.log('✅ Service: Rupture de Jeûne (published, 16:00-18:00)');

  // ============================================================================
  // SERVICE PACKS (Link packs to services)
  // ============================================================================
  console.log('\n🔗 Linking Packs to Services...');

  await prisma.servicePack.upsert({
    where: { packId: collationBasicPack.id },
    update: {},
    create: {
      serviceId: collationService.id,
      packId: collationBasicPack.id,
    },
  });
  console.log('✅ Linked: Basic Pack → Collation');

  await prisma.servicePack.upsert({
    where: { packId: ruptureBasicPack.id },
    update: {},
    create: {
      serviceId: ruptureJeuneService.id,
      packId: ruptureBasicPack.id,
    },
  });
  console.log('✅ Linked: Basic → Rupture de Jeûne');

  await prisma.servicePack.upsert({
    where: { packId: ruptureBasicPlusPack.id },
    update: {},
    create: {
      serviceId: ruptureJeuneService.id,
      packId: ruptureBasicPlusPack.id,
    },
  });
  console.log('✅ Linked: Basic+ → Rupture de Jeûne');

  await prisma.servicePack.upsert({
    where: { packId: rupturePremiumPack.id },
    update: {},
    create: {
      serviceId: ruptureJeuneService.id,
      packId: rupturePremiumPack.id,
    },
  });
  console.log('✅ Linked: Premium → Rupture de Jeûne');

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
  console.log('  - Fruits');
  console.log('  - Boisson');
  console.log('  - Douceur du Ramadan');
  console.log('  - Soupe');
  console.log('  - Plat Principal');
  console.log('  - Salade');
  console.log('  - Spécialité Tunisienne');
  console.log('  - Dessert');
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
