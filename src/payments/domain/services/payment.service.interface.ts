import { Payment } from '../entities/payment.entity';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';
import { CreatePaymentDto } from '../../application/dtos/create-payment.dto';
import { RefundPaymentDto } from '../../application/dtos/refund-payment.dto';

export const PAYMENT_SERVICE = 'PAYMENT_SERVICE';

export interface IPaymentService {
  findAll(): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
  findByUser(userId: string): Promise<Payment[]>;
  findBySubscription(subscriptionId: string): Promise<Payment[]>;
  createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment>;
  createSubscriptionPayment(subscription: Subscription): Promise<Payment>;
  markAsApproved(id: string, transactionId: string): Promise<Payment>;
  markAsFailed(id: string, failureReason?: string): Promise<Payment>;
  refund(id: string, refundPaymentDto: RefundPaymentDto): Promise<Payment>;
  processPayment(payment: Payment): Promise<Payment>;
}
