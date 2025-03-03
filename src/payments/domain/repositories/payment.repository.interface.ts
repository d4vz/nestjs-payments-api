import { Payment } from '../entities/payment.entity';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface IPaymentRepository {
  findAll(): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
  findByUser(userId: string): Promise<Payment[]>;
  findBySubscription(subscriptionId: string): Promise<Payment[]>;
  create(payment: Payment): Promise<Payment>;
  save(payment: Payment): Promise<Payment>;
  delete(id: string): Promise<boolean>;
}
