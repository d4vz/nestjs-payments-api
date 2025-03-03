import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export const SUBSCRIPTION_REPOSITORY = 'SUBSCRIPTION_REPOSITORY';

export interface ISubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  findById(id: string): Promise<Subscription | null>;
  findByUser(userId: string): Promise<Subscription[]>;
  findActiveByUser(userId: string): Promise<Subscription | null>;
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;
  findExpired(): Promise<Subscription[]>;
  create(subscription: Subscription): Promise<Subscription>;
  save(subscription: Subscription): Promise<Subscription>;
  delete(id: string): Promise<boolean>;
}
