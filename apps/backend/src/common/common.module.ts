import { Module } from '@nestjs/common';
import { OrderingCutoffService } from './services/ordering-cutoff.service';
import { OrderingLockService } from './services/ordering-lock.service';

@Module({
  providers: [OrderingCutoffService, OrderingLockService],
  exports: [OrderingCutoffService, OrderingLockService],
})
export class CommonModule {}
