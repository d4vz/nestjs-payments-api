import { Subscription } from '../entities/subscription.entity';

export class SubscriptionRenewedEvent {
  constructor(public readonly subscription: Subscription) {}
}
