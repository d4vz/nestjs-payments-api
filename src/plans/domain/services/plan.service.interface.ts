import { Plan } from '../entities/plan.entity';
import { CreatePlanDto } from '../../application/dtos/create-plan.dto';
import { UpdatePlanDto } from '../../application/dtos/update-plan.dto';

export const PLAN_SERVICE = 'PLAN_SERVICE';

export interface IPlanService {
  findAll(): Promise<Plan[]>;
  findById(id: string): Promise<Plan | null>;
  findActive(): Promise<Plan[]>;
  create(createPlanDto: CreatePlanDto): Promise<Plan>;
  update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan>;
  delete(id: string): Promise<boolean>;
  activate(id: string): Promise<Plan>;
  deactivate(id: string): Promise<Plan>;
}
