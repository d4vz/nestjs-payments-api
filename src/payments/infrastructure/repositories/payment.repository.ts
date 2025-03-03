import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly typeOrmRepository: Repository<Payment>,
  ) {}

  async findAll(): Promise<Payment[]> {
    return this.typeOrmRepository.find({
      relations: ['user', 'subscription'],
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.typeOrmRepository.findOne({
      where: { id },
      relations: ['user', 'subscription'],
    });
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.typeOrmRepository.find({
      where: { userId },
      relations: ['subscription'],
    });
  }

  async findBySubscription(subscriptionId: string): Promise<Payment[]> {
    return this.typeOrmRepository.find({
      where: { subscriptionId },
      relations: ['user'],
    });
  }

  async create(payment: Payment): Promise<Payment> {
    return this.typeOrmRepository.save(payment);
  }

  async save(payment: Payment): Promise<Payment> {
    return this.typeOrmRepository.save(payment);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeOrmRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}
