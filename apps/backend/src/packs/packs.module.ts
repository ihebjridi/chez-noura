import { Module } from '@nestjs/common';
import { PacksService } from './packs.service';
import { PacksController } from './packs.controller';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { VariantsController } from './variants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PacksController, ComponentsController, VariantsController],
  providers: [PacksService, ComponentsService],
  exports: [PacksService, ComponentsService],
})
export class PacksModule {}
