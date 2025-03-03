import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../users/domain/entities/user.entity';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';
import { Payment } from '../../../payments/domain/entities/payment.entity';
import { INotificationService } from '../../domain/services/notification.service.interface';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '../../domain/repositories/notification.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  EmailSentEvent,
  NotificationSentEvent,
  SmsSentEvent,
} from '../../domain/events/notification.events';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private notificationRepository: INotificationRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email
    console.log(`[EMAIL] Welcome email sent to ${user.email}`);
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email
    console.log(
      `[EMAIL] Password reset email sent to ${user.email} with token ${token}`,
    );
  }

  async sendSubscriptionCreatedNotification(
    subscription: Subscription,
  ): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Subscription created notification sent to user ${subscription.userId}`,
    );
  }

  async sendSubscriptionRenewedNotification(
    subscription: Subscription,
  ): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Subscription renewed notification sent to user ${subscription.userId}`,
    );
  }

  async sendSubscriptionCancelledNotification(
    subscription: Subscription,
  ): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Subscription cancelled notification sent to user ${subscription.userId}`,
    );
  }

  async sendSubscriptionExpiringNotification(
    subscription: Subscription,
    daysLeft: number,
  ): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Subscription expiring in ${daysLeft} days notification sent to user ${subscription.userId}`,
    );
  }

  async sendPaymentSuccessNotification(payment: Payment): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Payment success notification sent to user ${payment.userId}`,
    );
  }

  async sendPaymentFailedNotification(payment: Payment): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Payment failed notification sent to user ${payment.userId}`,
    );
  }

  async sendPaymentRefundedNotification(payment: Payment): Promise<void> {
    // Em um ambiente de produção, aqui teríamos integração com um serviço de email/notificação
    console.log(
      `[NOTIFICATION] Payment refunded notification sent to user ${payment.userId}`,
    );
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const result = await this.notificationRepository.sendEmail(
      to,
      subject,
      body,
    );

    if (result) {
      this.eventEmitter.emit(
        'notification.email.sent',
        new EmailSentEvent(to, subject, body),
      );
    }

    return result;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    const result = await this.notificationRepository.sendSms(to, message);

    if (result) {
      this.eventEmitter.emit(
        'notification.sms.sent',
        new SmsSentEvent(to, message),
      );
    }

    return result;
  }

  async notifyPaymentSuccess(userId: string, amount: number): Promise<void> {
    const message = `Pagamento de R$ ${amount.toFixed(2)} confirmado com sucesso.`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'payment_success',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'payment_success', message),
    );
  }

  async notifyPaymentFailure(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    const message = `Seu pagamento de R$ ${amount.toFixed(2)} falhou. Motivo: ${reason}`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'payment_failure',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'payment_failure', message),
    );
  }

  async notifySubscriptionCreated(
    userId: string,
    planName: string,
    endDate: Date,
  ): Promise<void> {
    const formattedDate = endDate.toLocaleDateString('pt-BR');
    const message = `Assinatura do plano ${planName} criada com sucesso. Válida até ${formattedDate}.`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'subscription_created',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'subscription_created', message),
    );
  }

  async notifySubscriptionRenewed(
    userId: string,
    planName: string,
    endDate: Date,
  ): Promise<void> {
    const formattedDate = endDate.toLocaleDateString('pt-BR');
    const message = `Assinatura do plano ${planName} renovada com sucesso. Válida até ${formattedDate}.`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'subscription_renewed',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'subscription_renewed', message),
    );
  }

  async notifySubscriptionCancelled(
    userId: string,
    planName: string,
  ): Promise<void> {
    const message = `Assinatura do plano ${planName} cancelada.`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'subscription_cancelled',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'subscription_cancelled', message),
    );
  }

  async notifySubscriptionExpiring(
    userId: string,
    planName: string,
    daysLeft: number,
  ): Promise<void> {
    const message = `Sua assinatura do plano ${planName} expira em ${daysLeft} dias.`;

    await this.notificationRepository.saveNotificationLog(
      userId,
      'subscription_expiring',
      message,
    );

    this.eventEmitter.emit(
      'notification.sent',
      new NotificationSentEvent(userId, 'subscription_expiring', message),
    );
  }

  async getNotificationsByUser(userId: string): Promise<any[]> {
    return this.notificationRepository.getNotificationsByUser(userId);
  }
}
