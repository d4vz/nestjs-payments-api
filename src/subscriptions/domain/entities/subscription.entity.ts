import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { Payment } from '../../../payments/domain/entities/payment.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  planId: string;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ default: 0 })
  failedPaymentAttempts: number;

  @Column({ nullable: true, type: 'datetime' })
  canceledAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.subscriptions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments: Payment[];

  constructor(partial?: Partial<Subscription>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  // Verifica se a assinatura está ativa
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  // Verifica se a assinatura está pendente (falha no pagamento)
  isPending(): boolean {
    return this.status === SubscriptionStatus.PENDING;
  }

  // Verifica se a assinatura foi cancelada
  isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  // Verifica se a assinatura está expirada
  isExpired(): boolean {
    return this.status === SubscriptionStatus.EXPIRED;
  }

  // Verifica se está na hora de renovar
  shouldRenew(): boolean {
    const now = new Date();
    return this.isActive() && this.endDate <= now;
  }

  // Atualiza o status para pendente e incrementa o contador de falhas
  markAsPending(): void {
    this.status = SubscriptionStatus.PENDING;
    this.failedPaymentAttempts += 1;
  }

  // Atualiza o status para ativo e reseta o contador de falhas
  markAsActive(endDate: Date): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.failedPaymentAttempts = 0;
    this.endDate = endDate;
  }

  // Cancela a assinatura
  cancel(): void {
    this.status = SubscriptionStatus.CANCELED;
    this.canceledAt = new Date();
  }

  // Marca como expirada após múltiplas falhas de pagamento
  markAsExpired(): void {
    this.status = SubscriptionStatus.EXPIRED;
  }
}
