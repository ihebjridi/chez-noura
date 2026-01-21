import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeesController } from './employees.controller';
import { BusinessEmployeesController } from './business-employees.controller';
import { EmployeeMenuService } from './employee-menu.service';
import { EmployeeOrdersService } from './employee-orders.service';
import { EmployeeManagementService } from './employee-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeesController, BusinessEmployeesController],
  providers: [
    EmployeeMenuService,
    EmployeeOrdersService,
    EmployeeManagementService,
  ],
  exports: [
    EmployeeMenuService,
    EmployeeOrdersService,
    EmployeeManagementService,
  ],
})
export class EmployeesModule {}
