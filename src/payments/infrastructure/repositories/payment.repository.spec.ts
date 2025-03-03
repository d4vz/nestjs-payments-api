import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepository } from './payment.repository';
import { Payment, PaymentStatus } from '../../domain/entities/payment.entity';

describe('PaymentRepository', () => {
  let repository: PaymentRepository;
  let mockTypeOrmRepository: Partial<Repository<Payment>>;

  const mockPayment = new Payment({
    id: 'test-id',
    userId: 'user-1',
    subscriptionId: 'sub-1',
    amount: 99.99,
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockPayments = [
    mockPayment,
    new Payment({
      id: 'test-id-2',
      userId: 'user-1',
      subscriptionId: 'sub-2',
      amount: 149.99,
      status: PaymentStatus.APPROVED,
      transactionId: 'tx-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ];

  beforeEach(async () => {
    mockTypeOrmRepository = {
      find: jest.fn().mockImplementation((options) => {
        if (options?.where?.userId) {
          return Promise.resolve(
            mockPayments.filter((p) => p.userId === options.where.userId),
          );
        }
        if (options?.where?.subscriptionId) {
          return Promise.resolve(
            mockPayments.filter(
              (p) => p.subscriptionId === options.where.subscriptionId,
            ),
          );
        }
        return Promise.resolve(mockPayments);
      }),
      findOne: jest.fn().mockImplementation((options) => {
        const payment = mockPayments.find((p) => p.id === options.where.id);
        return Promise.resolve(payment || null);
      }),
      save: jest.fn().mockImplementation((payment) => {
        return Promise.resolve({ ...payment, id: payment.id || 'new-id' });
      }),
      delete: jest.fn().mockImplementation((id) => {
        const exists = mockPayments.some((p) => p.id === id);
        return Promise.resolve({ affected: exists ? 1 : 0 });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRepository,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<PaymentRepository>(PaymentRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of payments', async () => {
      const result = await repository.findAll();
      expect(result).toEqual(mockPayments);
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['user', 'subscription'],
      });
    });
  });

  describe('findById', () => {
    it('should find a payment by id', async () => {
      const result = await repository.findById('test-id');
      expect(result).toEqual(mockPayment);
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['user', 'subscription'],
      });
    });

    it('should return null if payment is not found', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find payments by user id', async () => {
      const result = await repository.findByUser('user-1');
      expect(result).toEqual(mockPayments);
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['subscription'],
      });
    });
  });

  describe('findBySubscription', () => {
    it('should find payments by subscription id', async () => {
      const result = await repository.findBySubscription('sub-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-id');
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        relations: ['user'],
      });
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const newPayment = new Payment({
        userId: 'user-2',
        subscriptionId: 'sub-3',
        amount: 199.99,
        status: PaymentStatus.PENDING,
      });

      const result = await repository.create(newPayment);
      expect(result).toEqual({ ...newPayment, id: 'new-id' });
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(newPayment);
    });
  });

  describe('save', () => {
    it('should save an existing payment', async () => {
      const updatedPayment = { ...mockPayment, amount: 129.99 };
      const result = await repository.save(updatedPayment as Payment);
      expect(result).toEqual(updatedPayment);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(updatedPayment);
    });
  });

  describe('delete', () => {
    it('should delete a payment and return true if successful', async () => {
      const result = await repository.delete('test-id');
      expect(result).toBe(true);
      expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should return false if payment does not exist', async () => {
      (mockTypeOrmRepository.delete as jest.Mock).mockResolvedValueOnce({
        affected: 0,
      });
      const result = await repository.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
