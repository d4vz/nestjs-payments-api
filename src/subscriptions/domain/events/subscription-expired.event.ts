import { Subscription } from '../entities/subscription.entity';

export class SubscriptionExpiredEvent {
  constructor(public readonly subscription: Subscription) {}
}
