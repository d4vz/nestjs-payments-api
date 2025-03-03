import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../../../auth/domain/enums/role.enum';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', default: Role.USER })
  roles: Role[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  // Verifica se o usuário tem uma assinatura ativa
  hasActiveSubscription(): boolean {
    if (!this.subscriptions || this.subscriptions.length === 0) {
      return false;
    }
    return this.subscriptions.some((sub) => sub.isActive());
  }

  // Obtém a assinatura ativa do usuário, se houver
  getActiveSubscription(): Subscription | undefined {
    if (!this.subscriptions || this.subscriptions.length === 0) {
      return undefined;
    }
    return this.subscriptions.find((sub) => sub.isActive());
  }

  // Verifica se o usuário é um administrador
  isAdmin(): boolean {
    return this.roles.includes(Role.ADMIN);
  }
}
