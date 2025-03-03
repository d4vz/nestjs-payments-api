import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PlanDuration, PlanStatus } from '../../domain/entities/plan.entity';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(PlanDuration)
  duration?: PlanDuration;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
