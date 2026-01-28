import { Module } from '@nestjs/common';
import { BusinessServicesService } from './business-services.service';
import { BusinessServicesController } from './business-services.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessServicesController],
  providers: [BusinessServicesService],
  exports: [BusinessServicesService],
})
export class BusinessServicesModule {}
