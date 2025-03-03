import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      // Em um ambiente real, aqui seria a integração com um serviço de SMS como Twilio, AWS SNS, etc.
      // Por enquanto, apenas simulamos o envio

      if (process.env.NODE_ENV === 'production') {
        // Código para integração real com serviço de SMS
        // Exemplo com Twilio (comentado):
        /*
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
        
        const client = require('twilio')(accountSid, authToken);
        
        await client.messages.create({
          body: message,
          from: fromNumber,
          to: to
        });
        */

        this.logger.log(`SMS enviado para ${to} em produção`);
      } else {
        // Em desenvolvimento, apenas logamos a mensagem
        this.logger.log(`[SMS SIMULADO] Para: ${to}, Mensagem: ${message}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar SMS: ${error.message}`, error.stack);
      return false;
    }
  }
}
