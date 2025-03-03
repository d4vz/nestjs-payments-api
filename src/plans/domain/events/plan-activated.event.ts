import { Plan } from '../entities/plan.entity';

export class PlanActivatedEvent {
  constructor(public readonly plan: Plan) {}
}
