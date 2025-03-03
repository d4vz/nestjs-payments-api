import { Plan } from '../entities/plan.entity';

export class PlanDeactivatedEvent {
  constructor(public readonly plan: Plan) {}
}
