import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  subscriptionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true, type: 'datetime' })
  refundedAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Subscription, (subscription) => subscription.payments)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  constructor(partial?: Partial<Payment>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === PaymentStatus.APPROVED;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  markAsApproved(transactionId: string): void {
    this.status = PaymentStatus.APPROVED;
    this.transactionId = transactionId;
  }

  approve(transactionId: string): void {
    this.markAsApproved(transactionId);
  }

  markAsFailed(failureReason: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = failureReason;
  }

  fail(failureReason?: string): void {
    this.markAsFailed(failureReason || 'Payment processing failed');
  }

  markAsRefunded(): void {
    this.status = PaymentStatus.REFUNDED;
    this.refundedAt = new Date();
  }

  refund(reason?: string): void {
    if (reason) {
      this.failureReason = reason;
    }
    this.markAsRefunded();
  }

  canBeRefunded(): boolean {
    if (!this.isApproved()) {
      return false;
    }

    const now = new Date();
    const refundPeriod = new Date(this.createdAt);
    refundPeriod.setDate(refundPeriod.getDate() + 7);

    return now <= refundPeriod;
  }
}
