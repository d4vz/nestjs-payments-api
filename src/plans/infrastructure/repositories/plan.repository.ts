import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanStatus } from '../../domain/entities/plan.entity';
import { IPlanRepository } from '../../domain/repositories/plan.repository.interface';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly typeOrmRepository: Repository<Plan>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.typeOrmRepository.find();
  }

  async findById(id: string): Promise<Plan | null> {
    return this.typeOrmRepository.findOne({
      where: { id },
    });
  }

  async findByStatus(status: PlanStatus): Promise<Plan[]> {
    return this.typeOrmRepository.find({
      where: { status },
    });
  }

  async create(plan: Plan): Promise<Plan> {
    return this.typeOrmRepository.save(plan);
  }

  async save(plan: Plan): Promise<Plan> {
    return this.typeOrmRepository.save(plan);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.typeOrmRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}
