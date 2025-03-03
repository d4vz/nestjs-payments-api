import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.interface';
import { NOTIFICATION_SERVICE } from '../../../notifications/domain/services/notification.service.interface';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { RefundPaymentDto } from '../dtos/refund-payment.dto';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPaymentRepository: any;
  let mockNotificationService: any;
  let mockConfigService: any;
  let mockEventEmitter: any;

  const mockPayment = new Payment({
    id: 'test-id',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amount: 99.99,
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockApprovedPayment = new Payment({
    id: 'approved-id',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amount: 99.99,
    status: PaymentStatus.APPROVED,
    transactionId: 'tx-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockSubscription = {
    id: 'sub-1',
    userId: 'user-1',
    plan: {
      id: 'plan-1',
      name: 'Premium Plan',
      price: 99.99,
    },
    status: 'active',
  } as Subscription;

  beforeEach(async () => {
    mockPaymentRepository = {
      findAll: jest.fn().mockResolvedValue([mockPayment, mockApprovedPayment]),
      findById: jest.fn().mockImplementation((id) => {
        if (id === 'test-id') return Promise.resolve(mockPayment);
        if (id === 'approved-id') return Promise.resolve(mockApprovedPayment);
        return Promise.resolve(null);
      }),
      findByUser: jest.fn().mockResolvedValue([mockPayment]),
      findBySubscription: jest.fn().mockResolvedValue([mockPayment]),
      create: jest
        .fn()
        .mockImplementation((payment) =>
          Promise.resolve({ ...payment, id: 'new-payment-id' }),
        ),
      save: jest.fn().mockImplementation((payment) => Promise.resolve(payment)),
    };

    mockNotificationService = {
      sendPaymentSuccessNotification: jest.fn().mockResolvedValue(undefined),
      sendPaymentFailedNotification: jest.fn().mockResolvedValue(undefined),
      sendPaymentRefundedNotification: jest.fn().mockResolvedValue(undefined),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('sandbox'),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PAYMENT_REPOSITORY,
          useValue: mockPaymentRepository,
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: mockNotificationService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockPayment, mockApprovedPayment]);
      expect(mockPaymentRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a payment by id', async () => {
      const result = await service.findById('test-id');
      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should return null if payment not found', async () => {
      const result = await service.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return payments by user id', async () => {
      const result = await service.findByUser('user-1');
      expect(result).toEqual([mockPayment]);
      expect(mockPaymentRepository.findByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findBySubscription', () => {
    it('should return payments by subscription id', async () => {
      const result = await service.findBySubscription('sub-1');
      expect(result).toEqual([mockPayment]);
      expect(mockPaymentRepository.findBySubscription).toHaveBeenCalledWith(
        'sub-1',
      );
    });
  });

  describe('createPayment', () => {
    it('should create a new payment', async () => {
      // Mock the processPayment method to return a successful payment
      jest.spyOn(service, 'processPayment').mockResolvedValueOnce({
        ...mockPayment,
        id: 'new-payment-id',
        status: PaymentStatus.APPROVED,
        transactionId: 'mock-tx-id',
      } as Payment);

      const createPaymentDto: CreatePaymentDto = {
        userId: 'user-1',
        subscriptionId: 'sub-1',
        amount: 99.99,
      };

      const result = await service.createPayment(createPaymentDto);

      expect(result.id).toBe('new-payment-id');
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.created',
        expect.anything(),
      );
    });
  });

  describe('createSubscriptionPayment', () => {
    it('should create a payment from subscription', async () => {
      // Mock the processPayment method
      jest.spyOn(service, 'processPayment').mockResolvedValueOnce({
        ...mockPayment,
        id: 'new-payment-id',
        status: PaymentStatus.APPROVED,
        transactionId: 'mock-tx-id',
      } as Payment);

      const result = await service.createSubscriptionPayment(mockSubscription);

      expect(result.id).toBe('new-payment-id');
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(mockPaymentRepository.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.created',
        expect.anything(),
      );
    });

    it('should throw an error if subscription or plan is not valid', async () => {
      const invalidSubscription = {
        ...mockSubscription,
        plan: null,
      } as Subscription;

      await expect(
        service.createSubscriptionPayment(invalidSubscription),
      ).rejects.toThrow(
        new HttpException(
          'Subscription or plan not found',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('markAsApproved', () => {
    it('should mark a payment as approved', async () => {
      const updatedPayment = { ...mockPayment };
      updatedPayment.status = PaymentStatus.APPROVED;
      updatedPayment.transactionId = 'tx-123';

      const result = await service.markAsApproved('test-id', 'tx-123');

      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(result.transactionId).toBe('tx-123');
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.approved',
        expect.anything(),
      );
      expect(
        mockNotificationService.sendPaymentSuccessNotification,
      ).toHaveBeenCalled();
    });

    it('should throw an error if payment not found', async () => {
      await expect(
        service.markAsApproved('non-existent-id', 'tx-123'),
      ).rejects.toThrow(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw an error if payment is not pending', async () => {
      await expect(
        service.markAsApproved('approved-id', 'tx-456'),
      ).rejects.toThrow(
        new HttpException(
          'Only pending payments can be approved',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('markAsFailed', () => {
    it('should throw an error if payment is not pending', async () => {
      await expect(
        service.markAsFailed('approved-id', 'Test failure'),
      ).rejects.toThrow(
        new HttpException(
          'Only pending payments can be marked as failed',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('refund', () => {
    it('should refund a payment', async () => {
      // Override the canBeRefunded method for the test
      Object.defineProperty(mockApprovedPayment, 'canBeRefunded', {
        value: jest.fn().mockReturnValue(true),
      });

      const refundPaymentDto: RefundPaymentDto = {
        reason: 'Customer requested refund',
        percentageToRefund: 100,
      };

      const result = await service.refund('approved-id', refundPaymentDto);

      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.refunded',
        expect.anything(),
      );
      expect(
        mockNotificationService.sendPaymentRefundedNotification,
      ).toHaveBeenCalled();
    });

    it('should throw an error if payment not found', async () => {
      const refundPaymentDto: RefundPaymentDto = {
        reason: 'Customer requested refund',
        percentageToRefund: 100,
      };

      await expect(
        service.refund('non-existent-id', refundPaymentDto),
      ).rejects.toThrow(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );
    });
  });
});
