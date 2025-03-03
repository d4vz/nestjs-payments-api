import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PlanDuration {
  MONTHLY = 'monthly', // 30 dias
  QUARTERLY = 'quarterly', // 90 dias
  SEMIANNUAL = 'semiannual', // 180 dias
  ANNUAL = 'annual', // 365 dias
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'simple-enum',
    enum: PlanDuration,
    default: PlanDuration.MONTHLY,
  })
  duration: PlanDuration;

  @Column({
    type: 'simple-enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  constructor(partial?: Partial<Plan>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  // Método útil para converter a duração em dias
  getDurationInDays(): number {
    switch (this.duration) {
      case PlanDuration.MONTHLY:
        return 30;
      case PlanDuration.QUARTERLY:
        return 90;
      case PlanDuration.SEMIANNUAL:
        return 180;
      case PlanDuration.ANNUAL:
        return 365;
      default:
        return 30;
    }
  }

  // Verifica se o plano está ativo
  isActive(): boolean {
    return this.status === PlanStatus.ACTIVE;
  }
}
