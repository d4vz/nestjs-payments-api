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

import { Subscription } from '../../domain/entities/subscription.entity';
import { SUBSCRIPTION_SERVICE } from '../../domain/services/subscription.service.interface';
import { ISubscriptionService } from '../../domain/services/subscription.service.interface';
import { CreateSubscriptionDto } from '../../application/dtos/create-subscription.dto';
import { CurrentUser } from '../../../auth/infrastructure/decorators/current-user.decorator';
import { User } from '../../../users/domain/entities/user.entity';
import { AppAbility } from '../../../auth/domain/ability/ability.factory';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class SubscriptionsController {
  constructor(
    @Inject(SUBSCRIPTION_SERVICE)
    private readonly subscriptionService: ISubscriptionService,
  ) {}

  @Get()
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.READ, Subscription),
  )
  findAll() {
    return this.subscriptionService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.READ, Subscription),
  )
  async findOne(@Param('id') id: string) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }
    return subscription;
  }

  @Get('user/:userId')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.READ, Subscription),
  )
  findByUser(@Param('userId') userId: string) {
    return this.subscriptionService.findByUser(userId);
  }

  @Post()
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.CREATE, Subscription),
  )
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.create(createSubscriptionDto);
  }

  @Post(':id/cancel')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.UPDATE, Subscription),
  )
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isAdmin() && subscription.userId !== user.id) {
      throw new HttpException(
        'You are not authorized to cancel this subscription',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.subscriptionService.cancel(id);
  }

  @Post(':id/renew')
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.UPDATE, Subscription),
  )
  async renew(@Param('id') id: string, @CurrentUser() user: User) {
    const subscription = await this.subscriptionService.findById(id);
    if (!subscription) {
      throw new HttpException('Subscription not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isAdmin() && subscription.userId !== user.id) {
      throw new HttpException(
        'You are not authorized to renew this subscription',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.subscriptionService.renew(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMySubscriptions(@CurrentUser() user: User) {
    return this.subscriptionService.findByUser(user.id);
  }

  @Get('me/active')
  @UseGuards(JwtAuthGuard)
  findMyActiveSubscription(@CurrentUser() user: User) {
    return this.subscriptionService.findActiveByUser(user.id);
  }
}
