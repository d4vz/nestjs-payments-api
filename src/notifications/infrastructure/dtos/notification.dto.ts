import { ApiProperty } from '@nestjs/swagger';

export class NotificationLogDto {
  @ApiProperty({ description: 'ID da notificação' })
  id: string;

  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'Tipo da notificação' })
  type: string;

  @ApiProperty({ description: 'Mensagem da notificação' })
  message: string;

  @ApiProperty({ description: 'Data de criação da notificação' })
  createdAt: Date;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Endereço de email do destinatário' })
  to: string;

  @ApiProperty({ description: 'Assunto do email' })
  subject: string;

  @ApiProperty({ description: 'Corpo do email (HTML)' })
  body: string;
}

export class SendSmsDto {
  @ApiProperty({ description: 'Número de telefone do destinatário' })
  to: string;

  @ApiProperty({ description: 'Mensagem do SMS' })
  message: string;
}
