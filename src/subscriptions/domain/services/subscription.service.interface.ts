import { Subscription } from '../entities/subscription.entity';
import { CreateSubscriptionDto } from '../../application/dtos/create-subscription.dto';

export const SUBSCRIPTION_SERVICE = 'SUBSCRIPTION_SERVICE';

export interface ISubscriptionService {
  findAll(): Promise<Subscription[]>;
  findById(id: string): Promise<Subscription | null>;
  findByUser(userId: string): Promise<Subscription[]>;
  findActiveByUser(userId: string): Promise<Subscription | null>;
  create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription>;
  cancel(id: string): Promise<Subscription>;
  renew(id: string): Promise<Subscription>;
  markAsPending(id: string): Promise<Subscription>;
  markAsExpired(id: string): Promise<Subscription>;
  checkRenewals(): Promise<Subscription[]>;
}
