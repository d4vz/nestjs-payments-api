import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './domain/entities/payment.entity';
import { PAYMENT_SERVICE } from './domain/services/payment.service.interface';
import { PaymentService } from './application/services/payment.service';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository.interface';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PaymentsController } from './infrastructure/controllers/payments.controller';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationsModule),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: PAYMENT_SERVICE,
      useClass: PaymentService,
    },
  ],
  exports: [PAYMENT_SERVICE, PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
