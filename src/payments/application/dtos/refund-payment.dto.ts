import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RefundPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageToRefund: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
