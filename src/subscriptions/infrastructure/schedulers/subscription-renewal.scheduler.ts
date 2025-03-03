import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SUBSCRIPTION_SERVICE } from '../../domain/services/subscription.service.interface';
import { ISubscriptionService } from '../../domain/services/subscription.service.interface';

@Injectable()
export class SubscriptionRenewalScheduler {
  private readonly logger = new Logger(SubscriptionRenewalScheduler.name);

  constructor(
    @Inject(SUBSCRIPTION_SERVICE)
    private readonly subscriptionService: ISubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRenewals() {
    this.logger.log('Checking for subscriptions that need renewal...');

    try {
      const renewedSubscriptions =
        await this.subscriptionService.checkRenewals();

      this.logger.log(
        `Renewal check completed. ${renewedSubscriptions.length} subscriptions were renewed.`,
      );

      // Registrar detalhes das assinaturas renovadas
      if (renewedSubscriptions.length > 0) {
        renewedSubscriptions.forEach((subscription) => {
          this.logger.debug(
            `Subscription ${subscription.id} for user ${subscription.userId} was renewed until ${subscription.endDate}.`,
          );
        });
      }
    } catch (error) {
      this.logger.error('Error during subscription renewal check:', error);
    }
  }
}
