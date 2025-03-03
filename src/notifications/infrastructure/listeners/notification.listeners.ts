import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../domain/services/notification.service.interface';
import {
  PaymentApprovedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
} from '../../../payments/domain/events/payment.events';
import {
  SubscriptionCreatedEvent,
  SubscriptionRenewedEvent,
  SubscriptionCanceledEvent,
} from '../../../subscriptions/domain/events/subscription.events';

@Injectable()
export class NotificationListeners {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private notificationService: INotificationService,
  ) {}

  @OnEvent('payment.approved')
  async handlePaymentApproved(event: PaymentApprovedEvent) {
    await this.notificationService.notifyPaymentSuccess(
      event.payment.userId,
      event.payment.amount,
    );
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    await this.notificationService.notifyPaymentFailure(
      event.payment.userId,
      event.payment.amount,
      event.payment.failureReason || 'Falha desconhecida',
    );
  }

  @OnEvent('payment.refunded')
  async handlePaymentRefunded(event: PaymentRefundedEvent) {
    // Implementação de notificação para reembolso, se necessário
  }

  @OnEvent('subscription.created')
  async handleSubscriptionCreated(event: SubscriptionCreatedEvent) {
    await this.notificationService.notifySubscriptionCreated(
      event.subscription.userId,
      event.subscription.plan.name,
      event.subscription.endDate,
    );
  }

  @OnEvent('subscription.renewed')
  async handleSubscriptionRenewed(event: SubscriptionRenewedEvent) {
    await this.notificationService.notifySubscriptionRenewed(
      event.subscription.userId,
      event.subscription.plan.name,
      event.subscription.endDate,
    );
  }

  @OnEvent('subscription.canceled')
  async handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
    await this.notificationService.notifySubscriptionCancelled(
      event.subscription.userId,
      event.subscription.plan.name,
    );
  }
}
