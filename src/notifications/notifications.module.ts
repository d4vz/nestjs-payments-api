import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

import { NotificationService } from './application/services/notification.service';
import { NOTIFICATION_SERVICE } from './domain/services/notification.service.interface';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface';
import { NotificationLog } from './domain/entities/notification-log.entity';
import { NotificationsController } from './infrastructure/controllers/notifications.controller';
import { NotificationListeners } from './infrastructure/listeners/notification.listeners';
import { EmailService } from './infrastructure/services/email.service';
import { SmsService } from './infrastructure/services/sms.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([NotificationLog]),
    AuthModule,
  ],
  providers: [
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationService,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    NotificationListeners,
    EmailService,
    SmsService,
  ],
  exports: [NOTIFICATION_SERVICE, NOTIFICATION_REPOSITORY],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
