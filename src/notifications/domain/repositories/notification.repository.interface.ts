import { User } from '../../../users/domain/entities/user.entity';
import { NotificationLog } from '../entities/notification-log.entity';

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

export interface INotificationRepository {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
  sendSms(to: string, message: string): Promise<boolean>;
  saveNotificationLog(
    userId: string,
    type: string,
    message: string,
  ): Promise<NotificationLog>;
  getNotificationsByUser(userId: string): Promise<NotificationLog[]>;
}
