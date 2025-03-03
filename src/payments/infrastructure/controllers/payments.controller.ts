import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { PoliciesGuard } from '../../../auth/infrastructure/guards/policies.guard';
import { CheckPolicies } from '../../../auth/infrastructure/decorators/check-policies.decorator';
import { Action } from '../../../auth/domain/enums/action.enum';

import { Payment } from '../../domain/entities/payment.entity';
import { PAYMENT_SERVICE } from '../../domain/services/payment.service.interface';
import { IPaymentService } from '../../domain/services/payment.service.interface';
import { CreatePaymentDto } from '../../application/dtos/create-payment.dto';
import { RefundPaymentDto } from '../../application/dtos/refund-payment.dto';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { User } from '../../../users/domain/entities/user.entity';
import { AppAbility } from 'src/auth/domain/ability/ability.factory';

@Controller('payments')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class PaymentsController {
  constructor(
    @Inject(PAYMENT_SERVICE)
    private readonly paymentService: IPaymentService,
  ) {}

  @Get()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, Payment))
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, Payment))
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findById(id);
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }
    return payment;
  }

  @Get('user/:userId')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, Payment))
  findByUser(@Param('userId') userId: string) {
    return this.paymentService.findByUser(userId);
  }

  @Get('subscription/:subscriptionId')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, Payment))
  findBySubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentService.findBySubscription(subscriptionId);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) => ability.can(Action.CREATE, Payment))
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Post(':id/refund')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.UPDATE, Payment))
  refund(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @CurrentUser() user: User,
  ) {
    if (!user.isAdmin()) {
      this.paymentService.findById(id).then((payment) => {
        if (payment.userId !== user.id) {
          throw new HttpException(
            'You are not authorized to refund this payment',
            HttpStatus.FORBIDDEN,
          );
        }
      });
    }

    return this.paymentService.refund(id, refundPaymentDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyPayments(@CurrentUser() user: User) {
    return this.paymentService.findByUser(user.id);
  }
}
