import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Plan, PlanStatus } from '../../domain/entities/plan.entity';
import { IPlanService } from '../../domain/services/plan.service.interface';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';
import { PLAN_REPOSITORY } from '../../domain/repositories/plan.repository.interface';
import { IPlanRepository } from '../../domain/repositories/plan.repository.interface';
import { PlanCreatedEvent } from '../../domain/events/plan-created.event';
import { PlanUpdatedEvent } from '../../domain/events/plan-updated.event';
import { PlanActivatedEvent } from '../../domain/events/plan-activated.event';
import { PlanDeactivatedEvent } from '../../domain/events/plan-deactivated.event';

@Injectable()
export class PlanService implements IPlanService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private planRepository: IPlanRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.planRepository.findAll();
  }

  async findById(id: string): Promise<Plan | null> {
    return this.planRepository.findById(id);
  }

  async findActive(): Promise<Plan[]> {
    return this.planRepository.findByStatus(PlanStatus.ACTIVE);
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = new Plan(createPlanDto);
    const savedPlan = await this.planRepository.create(plan);

    this.eventEmitter.emit('plan.created', new PlanCreatedEvent(savedPlan));

    return savedPlan;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(plan, updatePlanDto);
    const updatedPlan = await this.planRepository.save(plan);

    this.eventEmitter.emit('plan.updated', new PlanUpdatedEvent(updatedPlan));

    return updatedPlan;
  }

  async delete(id: string): Promise<boolean> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    if (
      plan.subscriptions &&
      plan.subscriptions.some((subscription) => subscription.isActive())
    ) {
      throw new HttpException(
        'Cannot delete plan with active subscriptions',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.planRepository.delete(id);
  }

  async activate(id: string): Promise<Plan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    plan.status = PlanStatus.ACTIVE;
    const activatedPlan = await this.planRepository.save(plan);

    this.eventEmitter.emit(
      'plan.activated',
      new PlanActivatedEvent(activatedPlan),
    );

    return activatedPlan;
  }

  async deactivate(id: string): Promise<Plan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }

    plan.status = PlanStatus.INACTIVE;
    const deactivatedPlan = await this.planRepository.save(plan);

    this.eventEmitter.emit(
      'plan.deactivated',
      new PlanDeactivatedEvent(deactivatedPlan),
    );

    return deactivatedPlan;
  }
}
