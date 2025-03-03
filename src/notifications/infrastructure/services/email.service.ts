import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Em ambiente de desenvolvimento, usamos um serviço de teste
    // Em produção, configuramos com SMTP real
    if (process.env.NODE_ENV !== 'production') {
      this.setupDevTransporter();
    } else {
      this.setupProductionTransporter();
    }
  }

  private async setupDevTransporter() {
    // Cria uma conta de teste no Ethereal para desenvolvimento
    const testAccount = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    this.logger.log(`Email de teste configurado: ${testAccount.user}`);
  }

  private setupProductionTransporter() {
    // Configuração para ambiente de produção usando variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', true),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    this.logger.log('Email de produção configurado');
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>(
          'EMAIL_FROM',
          'noreply@example.com',
        ),
        to,
        subject,
        html: body,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Em desenvolvimento, mostra o link de preview
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`Email enviado: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        this.logger.log(`Email enviado para ${to}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`, error.stack);
      return false;
    }
  }
}
