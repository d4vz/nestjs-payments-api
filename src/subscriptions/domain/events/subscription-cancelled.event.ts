import { Subscription } from '../entities/subscription.entity';

export class SubscriptionCancelledEvent {
  constructor(public readonly subscription: Subscription) {}
}
