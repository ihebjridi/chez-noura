import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
