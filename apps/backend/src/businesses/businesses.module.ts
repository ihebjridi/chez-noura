import { Module, forwardRef } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController, BusinessController } from './businesses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ActivityLogsModule), CommonModule],
  controllers: [BusinessesController, BusinessController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
