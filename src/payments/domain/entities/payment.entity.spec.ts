import { Payment, PaymentStatus } from './payment.entity';

describe('Payment Entity', () => {
  let payment: Payment;

  beforeEach(() => {
    payment = new Payment({
      id: 'test-id',
      userId: 'user-1',
      subscriptionId: 'sub-1',
      amount: 99.99,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('Status Check Methods', () => {
    it('should correctly identify a pending payment', () => {
      payment.status = PaymentStatus.PENDING;
      expect(payment.isPending()).toBe(true);
      expect(payment.isApproved()).toBe(false);
      expect(payment.isFailed()).toBe(false);
      expect(payment.isRefunded()).toBe(false);
    });

    it('should correctly identify an approved payment', () => {
      payment.status = PaymentStatus.APPROVED;
      expect(payment.isPending()).toBe(false);
      expect(payment.isApproved()).toBe(true);
      expect(payment.isFailed()).toBe(false);
      expect(payment.isRefunded()).toBe(false);
    });

    it('should correctly identify a failed payment', () => {
      payment.status = PaymentStatus.FAILED;
      expect(payment.isPending()).toBe(false);
      expect(payment.isApproved()).toBe(false);
      expect(payment.isFailed()).toBe(true);
      expect(payment.isRefunded()).toBe(false);
    });

    it('should correctly identify a refunded payment', () => {
      payment.status = PaymentStatus.REFUNDED;
      expect(payment.isPending()).toBe(false);
      expect(payment.isApproved()).toBe(false);
      expect(payment.isFailed()).toBe(false);
      expect(payment.isRefunded()).toBe(true);
    });
  });

  describe('Status Change Methods', () => {
    it('should mark payment as approved with transaction ID', () => {
      payment.approve('tx-123456');
      expect(payment.status).toBe(PaymentStatus.APPROVED);
      expect(payment.transactionId).toBe('tx-123456');
    });

    it('should mark payment as failed with reason', () => {
      payment.fail('Insufficient funds');
      expect(payment.status).toBe(PaymentStatus.FAILED);
      expect(payment.failureReason).toBe('Insufficient funds');
    });

    it('should mark payment as failed with default reason when not provided', () => {
      payment.fail();
      expect(payment.status).toBe(PaymentStatus.FAILED);
      expect(payment.failureReason).toBe('Payment processing failed');
    });

    it('should mark payment as refunded', () => {
      // Setup payment as approved first
      payment.approve('tx-123456');

      // Now refund it
      payment.refund('Customer requested');
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
      expect(payment.failureReason).toBe('Customer requested');
      expect(payment.refundedAt).toBeInstanceOf(Date);
    });
  });

  describe('Refund Eligibility', () => {
    it('should allow refund for approved payment within 7 days', () => {
      // Setup payment as approved
      payment.approve('tx-123456');

      // Payment date is recent (today)
      payment.createdAt = new Date();

      expect(payment.canBeRefunded()).toBe(true);
    });

    it('should not allow refund for approved payment after 7 days', () => {
      // Setup payment as approved
      payment.approve('tx-123456');

      // Payment created 8 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      payment.createdAt = oldDate;

      expect(payment.canBeRefunded()).toBe(false);
    });

    it('should not allow refund for non-approved payments', () => {
      // Test for pending status
      payment.status = PaymentStatus.PENDING;
      expect(payment.canBeRefunded()).toBe(false);

      // Test for failed status
      payment.status = PaymentStatus.FAILED;
      expect(payment.canBeRefunded()).toBe(false);

      // Test for already refunded
      payment.status = PaymentStatus.REFUNDED;
      expect(payment.canBeRefunded()).toBe(false);
    });
  });
});
