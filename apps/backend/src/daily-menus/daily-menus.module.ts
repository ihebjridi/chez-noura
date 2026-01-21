import { Module } from '@nestjs/common';
import { DailyMenusService } from './daily-menus.service';
import { DailyMenusController } from './daily-menus.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DailyMenusController],
  providers: [DailyMenusService],
  exports: [DailyMenusService],
})
export class DailyMenusModule {}
