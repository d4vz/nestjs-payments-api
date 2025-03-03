import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { IPaymentService } from '../../domain/services/payment.service.interface';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { RefundPaymentDto } from '../dtos/refund-payment.dto';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';
import { ConfigService } from '@nestjs/config';
import { NOTIFICATION_SERVICE } from '../../../notifications/domain/services/notification.service.interface';
import { INotificationService } from '../../../notifications/domain/services/notification.service.interface';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.interface';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';

import {
  PaymentApprovedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
  PaymentCreatedEvent,
} from '../../domain/events/payment.events';

@Injectable()
export class PaymentService implements IPaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private paymentRepository: IPaymentRepository,
    private configService: ConfigService,
    @Inject(NOTIFICATION_SERVICE)
    private notificationService: INotificationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.findAll();
  }

  async findById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findById(id);
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.findByUser(userId);
  }

  async findBySubscription(subscriptionId: string): Promise<Payment[]> {
    return this.paymentRepository.findBySubscription(subscriptionId);
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = new Payment({
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedPayment = await this.paymentRepository.create(payment);

    this.eventEmitter.emit(
      'payment.created',
      new PaymentCreatedEvent(savedPayment),
    );

    return this.processPayment(savedPayment);
  }

  async createSubscriptionPayment(
    subscription: Subscription,
  ): Promise<Payment> {
    if (!subscription || !subscription.plan) {
      throw new HttpException(
        'Subscription or plan not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payment = new Payment({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: subscription.plan.price,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedPayment = await this.paymentRepository.create(payment);

    this.eventEmitter.emit(
      'payment.created',
      new PaymentCreatedEvent(savedPayment),
    );

    return this.processPayment(savedPayment);
  }

  async markAsApproved(id: string, transactionId: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    if (!payment.isPending()) {
      throw new HttpException(
        'Only pending payments can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }

    payment.approve(transactionId);
    const updatedPayment = await this.paymentRepository.save(payment);

    this.eventEmitter.emit(
      'payment.approved',
      new PaymentApprovedEvent(updatedPayment),
    );

    await this.notificationService.sendPaymentSuccessNotification(
      updatedPayment,
    );

    return updatedPayment;
  }

  async markAsFailed(id: string, failureReason?: string): Promise<Payment> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    if (!payment.isPending()) {
      throw new HttpException(
        'Only pending payments can be marked as failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    payment.fail(failureReason);
    const updatedPayment = await this.paymentRepository.save(payment);

    this.eventEmitter.emit(
      'payment.failed',
      new PaymentFailedEvent(updatedPayment),
    );

    await this.notificationService.sendPaymentFailedNotification(
      updatedPayment,
    );

    return updatedPayment;
  }

  async refund(
    id: string,
    refundPaymentDto: RefundPaymentDto,
  ): Promise<Payment> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    if (!payment.isApproved()) {
      throw new HttpException(
        'Only approved payments can be refunded',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!payment.canBeRefunded()) {
      throw new HttpException(
        'This payment cannot be refunded (time limit exceeded)',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Aqui teríamos a integração com gateway de pagamento para reembolso
      // Simulação de reembolso bem-sucedido
      payment.refund(refundPaymentDto.reason);
      const updatedPayment = await this.paymentRepository.save(payment);

      // Emitir evento de pagamento reembolsado
      this.eventEmitter.emit(
        'payment.refunded',
        new PaymentRefundedEvent(updatedPayment),
      );

      // Enviar notificação de reembolso
      await this.notificationService.sendPaymentRefundedNotification(
        updatedPayment,
      );

      return updatedPayment;
    } catch (error) {
      throw new HttpException(
        'Failed to process refund',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async processPayment(payment: Payment): Promise<Payment> {
    try {
      // Em um cenário real, aqui teríamos integração com um gateway de pagamento
      const paymentMode = this.configService.get<string>(
        'PAYMENT_MODE',
        'sandbox',
      );

      if (paymentMode === 'sandbox') {
        // Simular um pagamento bem-sucedido no ambiente de teste
        const mockTransactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return this.markAsApproved(payment.id, mockTransactionId);
      } else {
        // Integração com gateway de pagamento real
        // Por enquanto, vamos simular um pagamento bem-sucedido
        const mockTransactionId = `tx_live_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        return this.markAsApproved(payment.id, mockTransactionId);
      }
    } catch (error) {
      // Em caso de erro, marcar o pagamento como falho
      return this.markAsFailed(
        payment.id,
        error instanceof Error ? error.message : 'Unknown payment error',
      );
    }
  }
}
