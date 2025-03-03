import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription } from './domain/entities/subscription.entity';
import { SUBSCRIPTION_SERVICE } from './domain/services/subscription.service.interface';
import { SubscriptionService } from './application/services/subscription.service';
import { SubscriptionsController } from './infrastructure/controllers/subscriptions.controller';
import { SubscriptionRenewalScheduler } from './infrastructure/schedulers/subscription-renewal.scheduler';
import { SUBSCRIPTION_REPOSITORY } from './domain/repositories/subscription.repository.interface';
import { SubscriptionRepository } from './infrastructure/repositories/subscription.repository';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PlansModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [SubscriptionsController],
  providers: [
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepository,
    },
    {
      provide: SUBSCRIPTION_SERVICE,
      useClass: SubscriptionService,
    },
    SubscriptionRenewalScheduler,
  ],
  exports: [SUBSCRIPTION_SERVICE, SUBSCRIPTION_REPOSITORY],
})
export class SubscriptionsModule {}
