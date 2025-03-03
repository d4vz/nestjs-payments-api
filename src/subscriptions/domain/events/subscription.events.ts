export class SubscriptionCreatedEvent {
  constructor(
    public readonly subscription: {
      id: string;
      userId: string;
      plan: {
        id: string;
        name: string;
      };
      status: string;
      startDate: Date;
      endDate: Date;
    },
  ) {}
}

export class SubscriptionRenewedEvent {
  constructor(
    public readonly subscription: {
      id: string;
      userId: string;
      plan: {
        id: string;
        name: string;
      };
      status: string;
      startDate: Date;
      endDate: Date;
    },
  ) {}
}

export class SubscriptionCanceledEvent {
  constructor(
    public readonly subscription: {
      id: string;
      userId: string;
      plan: {
        id: string;
        name: string;
      };
      status: string;
      cancellationReason?: string;
    },
  ) {}
}

export class SubscriptionExpiringEvent {
  constructor(
    public readonly subscription: {
      id: string;
      userId: string;
      plan: {
        id: string;
        name: string;
      };
      status: string;
      endDate: Date;
      daysRemaining: number;
    },
  ) {}
}
