import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationLog } from '../../domain/entities/notification-log.entity';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    return this.emailService.sendEmail(to, subject, body);
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    return this.smsService.sendSms(to, message);
  }

  async saveNotificationLog(
    userId: string,
    type: string,
    message: string,
  ): Promise<NotificationLog> {
    const notificationLog = this.notificationLogRepository.create({
      userId,
      type,
      message,
      createdAt: new Date(),
    });

    return this.notificationLogRepository.save(notificationLog);
  }

  async getNotificationsByUser(userId: string): Promise<NotificationLog[]> {
    return this.notificationLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
