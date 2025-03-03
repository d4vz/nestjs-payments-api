import { Subscription } from '../entities/subscription.entity';

export class SubscriptionCreatedEvent {
  constructor(public readonly subscription: Subscription) {}
}
