import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './domain/entities/plan.entity';
import { PLAN_SERVICE } from './domain/services/plan.service.interface';
import { PlanService } from './application/services/plan.service';
import { PLAN_REPOSITORY } from './domain/repositories/plan.repository.interface';
import { PlanRepository } from './infrastructure/repositories/plan.repository';
import { PlansController } from './infrastructure/controllers/plans.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Plan]), forwardRef(() => AuthModule)],
  controllers: [PlansController],
  providers: [
    {
      provide: PLAN_REPOSITORY,
      useClass: PlanRepository,
    },
    {
      provide: PLAN_SERVICE,
      useClass: PlanService,
    },
  ],
  exports: [PLAN_SERVICE, PLAN_REPOSITORY],
})
export class PlansModule {}
