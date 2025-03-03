import { Plan } from '../entities/plan.entity';

export class PlanCreatedEvent {
  constructor(public readonly plan: Plan) {}
}
