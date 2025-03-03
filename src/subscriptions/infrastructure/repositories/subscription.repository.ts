import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';

@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly typeOrmRepository: Repository<Subscription>,
  ) {}

  async findAll(): Promise<Subscription[]> {
    return this.typeOrmRepository.find({
      relations: ['user', 'plan'],
    });
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.typeOrmRepository.findOne({
      where: { id },
      relations: ['user', 'plan', 'payments'],
    });
  }

  async findByUser(userId: string): Promise<Subscription[]> {
    return this.typeOrmRepository.find({
      where: { userId },
      relations: ['plan', 'payments'],
    });
  }

  async findActiveByUser(userId: string): Promise<Subscription | null> {
    return this.typeOrmRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });
  }

  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    return this.typeOrmRepository.find({
      where: { status },
      relations: ['plan', 'user'],
    });
  }

  async findExpired(): Promise<Subscription[]> {
    const now = new Date();
    return this.typeOrmRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: ['plan'],
    });
  }

  async create(subscription: Subscription): Promise<Subscription> {
    return this.typeOrmRepository.save(subscription);
  }

  async save(subscription: Subscription): Promise<Subscription> {
    return this.typeOrmRepository.save(subscription);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeOrmRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}
