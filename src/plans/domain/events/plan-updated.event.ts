import { Plan } from '../entities/plan.entity';

export class PlanUpdatedEvent {
  constructor(public readonly plan: Plan) {}
}
