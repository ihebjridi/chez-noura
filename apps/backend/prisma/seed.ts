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
