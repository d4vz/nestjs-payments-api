import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PAYMENT_SERVICE } from '../../domain/services/payment.service.interface';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';
import { CreatePaymentDto } from '../../application/dtos/create-payment.dto';
import { RefundPaymentDto } from '../../application/dtos/refund-payment.dto';
import { User } from '../../../users/domain/entities/user.entity';
import { AbilityFactory } from '../../../auth/domain/ability/ability.factory';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentService: any;

  const mockPayment = {
    id: 'test-id',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amount: 99.99,
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Payment;

  const mockApprovedPayment = {
    ...mockPayment,
    id: 'approved-id',
    status: PaymentStatus.APPROVED,
    transactionId: 'tx-123',
  } as Payment;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isAdmin: jest.fn().mockReturnValue(false),
  } as unknown as User;

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: jest.fn().mockReturnValue(true),
  } as unknown as User;

  beforeEach(async () => {
    mockPaymentService = {
      findAll: jest.fn().mockResolvedValue([mockPayment, mockApprovedPayment]),
      findById: jest.fn().mockImplementation((id) => {
        if (id === 'test-id') return Promise.resolve(mockPayment);
        if (id === 'approved-id') return Promise.resolve(mockApprovedPayment);
        return Promise.resolve(null);
      }),
      findByUser: jest.fn().mockResolvedValue([mockPayment]),
      findBySubscription: jest.fn().mockResolvedValue([mockPayment]),
      createPayment: jest.fn().mockImplementation((dto) =>
        Promise.resolve({
          ...mockPayment,
          id: 'new-payment-id',
          ...dto,
        }),
      ),
      refund: jest.fn().mockImplementation((id, dto) => {
        if (id === 'approved-id') {
          return Promise.resolve({
            ...mockApprovedPayment,
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
            failureReason: dto.reason,
          });
        }
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PAYMENT_SERVICE,
          useValue: mockPaymentService,
        },
        AbilityFactory,
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of payments', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockPayment, mockApprovedPayment]);
      expect(mockPaymentService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a payment when it exists', async () => {
      const result = await controller.findOne('test-id');
      expect(result).toEqual(mockPayment);
      expect(mockPaymentService.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw an exception when payment does not exist', async () => {
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        new HttpException('Payment not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('findByUser', () => {
    it('should return payments for a specific user', async () => {
      const result = await controller.findByUser('user-1');
      expect(result).toEqual([mockPayment]);
      expect(mockPaymentService.findByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findBySubscription', () => {
    it('should return payments for a subscription', async () => {
      const result = await controller.findBySubscription('sub-1');
      expect(result).toEqual([mockPayment]);
      expect(mockPaymentService.findBySubscription).toHaveBeenCalledWith(
        'sub-1',
      );
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createPaymentDto: CreatePaymentDto = {
        userId: 'user-1',
        subscriptionId: 'sub-1',
        amount: 99.99,
      };

      const result = await controller.create(createPaymentDto);
      expect(result).toMatchObject({
        id: 'new-payment-id',
        userId: 'user-1',
        subscriptionId: 'sub-1',
        amount: 99.99,
      });
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith(
        createPaymentDto,
      );
    });
  });

  describe('refund', () => {
    it('should refund a payment for admin user', async () => {
      const refundPaymentDto: RefundPaymentDto = {
        reason: 'Customer requested refund',
        percentageToRefund: 100,
      };

      const result = await controller.refund(
        'approved-id',
        refundPaymentDto,
        mockAdminUser,
      );

      expect(result).toMatchObject({
        id: 'approved-id',
        status: PaymentStatus.REFUNDED,
      });
      expect(mockPaymentService.refund).toHaveBeenCalledWith(
        'approved-id',
        refundPaymentDto,
      );
    });

    it('should allow refund for the payment owner', async () => {
      const refundPaymentDto: RefundPaymentDto = {
        reason: 'Customer requested refund',
        percentageToRefund: 100,
      };

      const result = await controller.refund(
        'approved-id',
        refundPaymentDto,
        mockUser,
      );

      expect(result).toMatchObject({
        id: 'approved-id',
        status: PaymentStatus.REFUNDED,
      });
      expect(mockPaymentService.refund).toHaveBeenCalledWith(
        'approved-id',
        refundPaymentDto,
      );
    });
  });

  describe('findMyPayments', () => {
    it('should return payments for the current user', async () => {
      const result = await controller.findMyPayments(mockUser);
      expect(result).toEqual([mockPayment]);
      expect(mockPaymentService.findByUser).toHaveBeenCalledWith('user-1');
    });
  });
});
