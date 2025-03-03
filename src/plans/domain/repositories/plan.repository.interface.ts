import { Plan, PlanStatus } from '../entities/plan.entity';

export const PLAN_REPOSITORY = 'PLAN_REPOSITORY';

export interface IPlanRepository {
  findAll(): Promise<Plan[]>;
  findById(id: string): Promise<Plan | null>;
  findByStatus(status: PlanStatus): Promise<Plan[]>;
  create(plan: Plan): Promise<Plan>;
  save(plan: Plan): Promise<Plan>;
  delete(id: string): Promise<boolean>;
}
