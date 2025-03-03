import { User } from '../../../users/domain/entities/user.entity';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';
import { Payment } from '../../../payments/domain/entities/payment.entity';

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

export interface INotificationService {
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordResetEmail(user: User, token: string): Promise<void>;
  sendSubscriptionCreatedNotification(
    subscription: Subscription,
  ): Promise<void>;
  sendSubscriptionRenewedNotification(
    subscription: Subscription,
  ): Promise<void>;
  sendSubscriptionCancelledNotification(
    subscription: Subscription,
  ): Promise<void>;
  sendSubscriptionExpiringNotification(
    subscription: Subscription,
    daysLeft: number,
  ): Promise<void>;
  sendPaymentSuccessNotification(payment: Payment): Promise<void>;
  sendPaymentFailedNotification(payment: Payment): Promise<void>;
  sendPaymentRefundedNotification(payment: Payment): Promise<void>;
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  sendSms(to: string, message: string): Promise<boolean>;
  notifyPaymentSuccess(userId: string, amount: number): Promise<void>;
  notifyPaymentFailure(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void>;
  notifySubscriptionCreated(
    userId: string,
    planName: string,
    endDate: Date,
  ): Promise<void>;
  notifySubscriptionRenewed(
    userId: string,
    planName: string,
    endDate: Date,
  ): Promise<void>;
  notifySubscriptionCancelled(userId: string, planName: string): Promise<void>;
  notifySubscriptionExpiring(
    userId: string,
    planName: string,
    daysLeft: number,
  ): Promise<void>;
  getNotificationsByUser(userId: string): Promise<any[]>;
}
