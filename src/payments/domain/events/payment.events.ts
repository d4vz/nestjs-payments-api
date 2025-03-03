import { Payment, PaymentStatus } from '../entities/payment.entity';

export class PaymentApprovedEvent {
  constructor(
    public readonly payment: {
      id: string;
      userId: string;
      amount: number;
      status: string;
      createdAt: Date;
    },
  ) {}
}

export class PaymentFailedEvent {
  constructor(
    public readonly payment: {
      id: string;
      userId: string;
      amount: number;
      status: string;
      failureReason?: string;
      createdAt: Date;
    },
  ) {}
}

export class PaymentRefundedEvent {
  constructor(
    public readonly payment: {
      id: string;
      userId: string;
      amount: number;
      status: string;
      refundReason?: string;
      createdAt: Date;
    },
  ) {}
}

export class PaymentCreatedEvent {
  constructor(
    public readonly payment: {
      id: string;
      userId: string;
      amount: number;
      status: string;
      createdAt: Date;
    },
  ) {}
}
