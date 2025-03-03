import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PlanDuration, PlanStatus } from '../../domain/entities/plan.entity';

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(PlanDuration)
  duration: PlanDuration;

  @IsEnum(PlanStatus)
  status: PlanStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
