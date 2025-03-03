import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { ISubscriptionService } from '../../domain/services/subscription.service.interface';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { PLAN_SERVICE } from '../../../plans/domain/services/plan.service.interface';
import { IPlanService } from '../../../plans/domain/services/plan.service.interface';
import { PlanStatus } from '../../../plans/domain/entities/plan.entity';
import { USER_SERVICE } from '../../../users/domain/services/user.service.interface';
import { IUserService } from '../../../users/domain/services/user.service.interface';
import { PAYMENT_SERVICE } from '../../../payments/domain/services/payment.service.interface';
import { IPaymentService } from '../../../payments/domain/services/payment.service.interface';
import { NOTIFICATION_SERVICE } from '../../../notifications/domain/services/notification.service.interface';
import { INotificationService } from '../../../notifications/domain/services/notification.service.interface';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/repositories/subscription.repository.interface';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { SubscriptionCreatedEvent } from '../../domain/events/subscription-created.event';
import { SubscriptionRenewedEvent } from '../../domain/events/subscription-renewed.event';
import { SubscriptionCancelledEvent } from '../../domain/events/subscription-cancelled.event';
import { SubscriptionExpiredEvent } from '../../domain/events/subscription-expired.event';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private subscriptionRepository: ISubscriptionRepository,
    @Inject(PLAN_SERVICE)
    private planService: IPlanService,
    @Inject(USER_SERVICE)
    private userService: IUserService,
    @Inject(PAYMENT_SERVICE)
    private paymentService: IPaymentService,
    @Inject(NOTIFICATION_SERVICE)
    private notificationService: INotificationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.findAll();
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findById(id);
  }

  async findByUser(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.findByUser(userId);
  }

  async findActiveByUser(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findActiveByUser(userId);
  }

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const { userId, planId } = createSubscriptionDto;

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const plan = await this.planService.findById(planId);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    if (plan.status === PlanStatus.INACTIVE) {
      throw new HttpException(
        'Cannot subscribe to inactive plan',
        HttpStatus.BAD_REQUEST,
      );
    }

    const activeSubscription = await this.findActiveByUser(userId);
    if (activeSubscription) {
      throw new HttpException(
        'User already has an active subscription',
        HttpStatus.BAD_REQUEST,
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.getDurationInDays());

    const subscription = new Subscription({
      userId,
      planId,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    const savedSubscription =
      await this.subscriptionRepository.create(subscription);

    this.eventEmitter.emit(
      'subscription.created',
      new SubscriptionCreatedEvent(savedSubscription),
    );

    await this.paymentService.createSubscriptionPayment(savedSubscription);

    await this.notificationService.sendSubscriptionCreatedNotification(
      savedSubscription,
    );

    return savedSubscription;
  }

  async cancel(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (!subscription.isActive() && !subscription.isPending()) {
      throw new HttpException(
        'Only active or pending subscriptions can be canceled',
        HttpStatus.BAD_REQUEST,
      );
    }

    subscription.cancel();
    const cancelledSubscription =
      await this.subscriptionRepository.save(subscription);

    this.eventEmitter.emit(
      'subscription.cancelled',
      new SubscriptionCancelledEvent(cancelledSubscription),
    );

    await this.notificationService.sendSubscriptionCancelledNotification(
      cancelledSubscription,
    );

    return cancelledSubscription;
  }

  async renew(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    const plan = await this.planService.findById(subscription.planId);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + plan.getDurationInDays());

    subscription.markAsActive(newEndDate);

    const renewedSubscription =
      await this.subscriptionRepository.save(subscription);

    this.eventEmitter.emit(
      'subscription.renewed',
      new SubscriptionRenewedEvent(renewedSubscription),
    );

    await this.paymentService.createSubscriptionPayment(renewedSubscription);

    await this.notificationService.sendSubscriptionRenewedNotification(
      renewedSubscription,
    );

    return renewedSubscription;
  }

  async markAsPending(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    subscription.markAsPending();

    if (subscription.failedPaymentAttempts >= 3) {
      subscription.markAsExpired();

      const savedSubscription =
        await this.subscriptionRepository.save(subscription);
      this.eventEmitter.emit(
        'subscription.expired',
        new SubscriptionExpiredEvent(savedSubscription),
      );
      return savedSubscription;
    }

    return this.subscriptionRepository.save(subscription);
  }

  async markAsExpired(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    subscription.markAsExpired();
    const expiredSubscription =
      await this.subscriptionRepository.save(subscription);

    this.eventEmitter.emit(
      'subscription.expired',
      new SubscriptionExpiredEvent(expiredSubscription),
    );

    return expiredSubscription;
  }

  async checkRenewals(): Promise<Subscription[]> {
    const expiredSubscriptions =
      await this.subscriptionRepository.findExpired();
    const renewedSubscriptions: Subscription[] = [];

    for (const subscription of expiredSubscriptions) {
      try {
        const renewed = await this.renew(subscription.id);
        renewedSubscriptions.push(renewed);
      } catch (error) {
        await this.markAsPending(subscription.id);

        console.error(`Error renewing subscription ${subscription.id}:`, error);
      }
    }

    return renewedSubscriptions;
  }
}
