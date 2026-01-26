import { Module } from '@nestjs/common';
import { OrderingCutoffService } from './services/ordering-cutoff.service';
import { OrderingLockService } from './services/ordering-lock.service';
import { FileStorageService } from './services/file-storage.service';

@Module({
  providers: [OrderingCutoffService, OrderingLockService, FileStorageService],
  exports: [OrderingCutoffService, OrderingLockService, FileStorageService],
})
export class CommonModule {}
