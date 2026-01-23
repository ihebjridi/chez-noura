import { EntityStatus, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";



const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })


async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for users who need it
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create SUPER_ADMIN user
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

  // 2. Create a Business
  console.log('Creating Business...');
  const business = await prisma.business.upsert({
    where: { email: 'contact@example-company.tn' },
    update: {},
    create: {
      name: 'Example Company',
      email: 'contact@example-company.tn',
      phone: '+216 12 345 678',
      address: '123 Business Street, Tunis, Tunisia',
      status: EntityStatus.ACTIVE,
    },
  });
  console.log('✅ Business created:', business.name);

  // 3. Create BUSINESS_ADMIN user
  console.log('Creating BUSINESS_ADMIN user...');
  const businessAdmin = await prisma.user.upsert({
    where: { email: 'business-admin@example-company.tn' },
    update: {},
    create: {
      email: 'business-admin@example-company.tn',
      password: hashedPassword,
      role: UserRole.BUSINESS_ADMIN,
      businessId: business.id,
    },
  });
  console.log('✅ BUSINESS_ADMIN created:', businessAdmin.email);

  // 4. Create Employee
  console.log('Creating Employee...');
  const employee = await prisma.employee.upsert({
    where: { email: 'employee@example-company.tn' },
    update: {},
    create: {
      email: 'employee@example-company.tn',
      firstName: 'John',
      lastName: 'Doe',
      businessId: business.id,
      status: EntityStatus.ACTIVE,
    },
  });
  console.log('✅ Employee created:', `${employee.firstName} ${employee.lastName}`);

  // 5. Create EMPLOYEE user (linked to the employee)
  console.log('Creating EMPLOYEE user...');
  const employeeUser = await prisma.user.upsert({
    where: { email: employee.email },
    update: {},
    create: {
      email: employee.email,
      password: null, // Email-based auth, no password
      role: UserRole.EMPLOYEE,
      businessId: business.id,
      employeeId: employee.id,
    },
  });
  console.log('✅ EMPLOYEE user created:', employeeUser.email);

  // 6. Create additional employees for testing
  console.log('Creating additional employees...');
  const employees = [
    {
      email: 'jane.smith@example-company.tn',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    {
      email: 'ahmed.benali@example-company.tn',
      firstName: 'Ahmed',
      lastName: 'Benali',
    },
  ];

  for (const empData of employees) {
    const emp = await prisma.employee.upsert({
      where: { email: empData.email },
      update: {},
      create: {
        email: empData.email,
        firstName: empData.firstName,
        lastName: empData.lastName,
        businessId: business.id,
        status: EntityStatus.ACTIVE,
      },
    });

    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: null,
        role: UserRole.EMPLOYEE,
        businessId: business.id,
        employeeId: emp.id,
      },
    });
    console.log(`✅ Employee created: ${emp.firstName} ${emp.lastName}`);
  }

  // 7. Create a second business with its admin and employees
  console.log('Creating second business...');
  const business2 = await prisma.business.upsert({
    where: { email: 'contact@another-company.tn' },
    update: {},
    create: {
      name: 'Another Company',
      email: 'contact@another-company.tn',
      phone: '+216 98 765 432',
      address: '456 Corporate Avenue, Sfax, Tunisia',
      status: EntityStatus.ACTIVE,
    },
  });
  console.log('✅ Second business created:', business2.name);

  const businessAdmin2 = await prisma.user.upsert({
    where: { email: 'admin@another-company.tn' },
    update: {},
    create: {
      email: 'admin@another-company.tn',
      password: hashedPassword,
      role: UserRole.BUSINESS_ADMIN,
      businessId: business2.id,
    },
  });
  console.log('✅ Second BUSINESS_ADMIN created:', businessAdmin2.email);

  // 8. Create Components
  console.log('\nCreating Components...');
  const components = [
    { name: 'Soup' },
    { name: 'Main Dish' },
    { name: 'Salad' },
    { name: 'Brik/Tajin' },
    { name: 'Dessert' },
  ];

  const createdComponents: Array<{ id: string; name: string; createdAt: Date; updatedAt: Date }> = [];
  for (const compData of components) {
    const component = await prisma.component.upsert({
      where: { name: compData.name },
      update: {},
      create: compData,
    });
    createdComponents.push(component);
    console.log(`✅ Component created: ${component.name}`);
  }

  // 9. Create Variants for each Component
  console.log('\nCreating Variants...');
  const variantsData = [
    // Soup variants
    { componentName: 'Soup', name: 'Lentil Soup', stockQuantity: 50, isActive: true },
    { componentName: 'Soup', name: 'Pumpkin Soup', stockQuantity: 50, isActive: true },
    { componentName: 'Soup', name: 'Chorba', stockQuantity: 50, isActive: true },
    { componentName: 'Soup', name: 'Vegetable Soup', stockQuantity: 50, isActive: true },
    
    // Main Dish variants
    { componentName: 'Main Dish', name: 'Chicken Tagine', stockQuantity: 50, isActive: true },
    { componentName: 'Main Dish', name: 'Lamb Tagine', stockQuantity: 50, isActive: true },
    { componentName: 'Main Dish', name: 'Fish Tagine', stockQuantity: 50, isActive: true },
    { componentName: 'Main Dish', name: 'Vegetarian Tagine', stockQuantity: 50, isActive: true },
    { componentName: 'Main Dish', name: 'Couscous', stockQuantity: 50, isActive: true },
    
    // Salad variants
    { componentName: 'Salad', name: 'Tunisian Salad', stockQuantity: 50, isActive: true },
    { componentName: 'Salad', name: 'Green Salad', stockQuantity: 50, isActive: true },
    { componentName: 'Salad', name: 'Carrot Salad', stockQuantity: 50, isActive: true },
    { componentName: 'Salad', name: 'Potato Salad', stockQuantity: 50, isActive: true },
    
    // Brik/Tajin variants
    { componentName: 'Brik/Tajin', name: 'Brik with Egg', stockQuantity: 50, isActive: true },
    { componentName: 'Brik/Tajin', name: 'Brik with Tuna', stockQuantity: 50, isActive: true },
    { componentName: 'Brik/Tajin', name: 'Tajin', stockQuantity: 50, isActive: true },
    
    // Dessert variants
    { componentName: 'Dessert', name: 'Baklava', stockQuantity: 50, isActive: true },
    { componentName: 'Dessert', name: 'Zlabia', stockQuantity: 50, isActive: true },
    { componentName: 'Dessert', name: 'Fruit', stockQuantity: 50, isActive: true },
  ];

  for (const variantData of variantsData) {
    const component = createdComponents.find(c => c.name === variantData.componentName);
    if (!component) {
      console.warn(`⚠️  Component not found: ${variantData.componentName}`);
      continue;
    }

    await prisma.variant.upsert({
      where: {
        componentId_name: {
          componentId: component.id,
          name: variantData.name,
        },
      },
      update: {
        stockQuantity: variantData.stockQuantity,
        isActive: variantData.isActive,
      },
      create: {
        componentId: component.id,
        name: variantData.name,
        stockQuantity: variantData.stockQuantity,
        isActive: variantData.isActive,
      },
    });
    console.log(`✅ Variant created: ${variantData.componentName} - ${variantData.name}`);
  }

  // 10. Create Packs
  console.log('\nCreating Packs...');
  const packs = [
    { name: 'Express', price: 15.00, isActive: true },
    { name: 'Basic', price: 25.00, isActive: true },
    { name: 'Premium', price: 35.00, isActive: true },
  ];

  const createdPacks: Array<{ id: string; name: string; price: any; isActive: boolean; createdAt: Date; updatedAt: Date }> = [];
  for (const packData of packs) {
    const pack = await prisma.pack.upsert({
      where: { name: packData.name },
      update: {
        price: packData.price,
        isActive: packData.isActive,
      },
      create: packData,
    });
    createdPacks.push(pack);
    console.log(`✅ Pack created: ${pack.name} (${pack.price} TND)`);
  }

  // 11. Create PackComponents (link packs to components)
  console.log('\nCreating Pack Components...');
  
  // Express Pack: Soup, Main Dish (required), Salad (optional)
  const expressPack = createdPacks.find(p => p.name === 'Express');
  const soupComponent = createdComponents.find(c => c.name === 'Soup');
  const mainDishComponent = createdComponents.find(c => c.name === 'Main Dish');
  const saladComponent = createdComponents.find(c => c.name === 'Salad');

  if (expressPack && soupComponent && mainDishComponent && saladComponent) {
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: expressPack.id,
          componentId: soupComponent.id,
        },
      },
      update: {},
      create: {
        packId: expressPack.id,
        componentId: soupComponent.id,
        required: true,
        orderIndex: 0,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: expressPack.id,
          componentId: mainDishComponent.id,
        },
      },
      update: {},
      create: {
        packId: expressPack.id,
        componentId: mainDishComponent.id,
        required: true,
        orderIndex: 1,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: expressPack.id,
          componentId: saladComponent.id,
        },
      },
      update: {},
      create: {
        packId: expressPack.id,
        componentId: saladComponent.id,
        required: false,
        orderIndex: 2,
      },
    });
    console.log('✅ Express Pack components configured');
  }

  // Basic Pack: Soup, Main Dish, Salad, Brik/Tajin (all required)
  const basicPack = createdPacks.find(p => p.name === 'Basic');
  const brikComponent = createdComponents.find(c => c.name === 'Brik/Tajin');

  if (basicPack && soupComponent && mainDishComponent && saladComponent && brikComponent) {
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: basicPack.id,
          componentId: soupComponent.id,
        },
      },
      update: {},
      create: {
        packId: basicPack.id,
        componentId: soupComponent.id,
        required: true,
        orderIndex: 0,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: basicPack.id,
          componentId: mainDishComponent.id,
        },
      },
      update: {},
      create: {
        packId: basicPack.id,
        componentId: mainDishComponent.id,
        required: true,
        orderIndex: 1,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: basicPack.id,
          componentId: saladComponent.id,
        },
      },
      update: {},
      create: {
        packId: basicPack.id,
        componentId: saladComponent.id,
        required: true,
        orderIndex: 2,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: basicPack.id,
          componentId: brikComponent.id,
        },
      },
      update: {},
      create: {
        packId: basicPack.id,
        componentId: brikComponent.id,
        required: true,
        orderIndex: 3,
      },
    });
    console.log('✅ Basic Pack components configured');
  }

  // Premium Pack: All components (all required)
  const premiumPack = createdPacks.find(p => p.name === 'Premium');
  const dessertComponent = createdComponents.find(c => c.name === 'Dessert');

  if (premiumPack && soupComponent && mainDishComponent && saladComponent && brikComponent && dessertComponent) {
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
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: premiumPack.id,
          componentId: mainDishComponent.id,
        },
      },
      update: {},
      create: {
        packId: premiumPack.id,
        componentId: mainDishComponent.id,
        required: true,
        orderIndex: 1,
      },
    });
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
        orderIndex: 2,
      },
    });
    await prisma.packComponent.upsert({
      where: {
        packId_componentId: {
          packId: premiumPack.id,
          componentId: brikComponent.id,
        },
      },
      update: {},
      create: {
        packId: premiumPack.id,
        componentId: brikComponent.id,
        required: true,
        orderIndex: 3,
      },
    });
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
        orderIndex: 4,
      },
    });
    console.log('✅ Premium Pack components configured');
  }

  console.log('\n📋 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUPER_ADMIN:');
  console.log(`  Email: admin@cheznoura.tn`);
  console.log(`  Password: password123`);
  console.log('\nBUSINESS_ADMIN (Example Company):');
  console.log(`  Email: business-admin@example-company.tn`);
  console.log(`  Password: password123`);
  console.log('\nEMPLOYEES (Example Company):');
  console.log(`  Email: employee@example-company.tn (John Doe)`);
  console.log(`  Email: jane.smith@example-company.tn`);
  console.log(`  Email: ahmed.benali@example-company.tn`);
  console.log('\nBUSINESS_ADMIN (Another Company):');
  console.log(`  Email: admin@another-company.tn`);
  console.log(`  Password: password123`);
  console.log('\nPACKS:');
  console.log(`  Express: 15.00 TND (Soup, Main Dish, Salad)`);
  console.log(`  Basic: 25.00 TND (Soup, Main Dish, Salad, Brik/Tajin)`);
  console.log(`  Premium: 35.00 TND (All components)`);
  console.log('\nCOMPONENTS:');
  console.log(`  - Soup (4 variants)`);
  console.log(`  - Main Dish (5 variants)`);
  console.log(`  - Salad (4 variants)`);
  console.log(`  - Brik/Tajin (3 variants)`);
  console.log(`  - Dessert (3 variants)`);
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
