import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';
import { ActivityLogsController } from './activity-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogInterceptor],
  exports: [ActivityLogsService, ActivityLogInterceptor],
})
export class ActivityLogsModule {}
