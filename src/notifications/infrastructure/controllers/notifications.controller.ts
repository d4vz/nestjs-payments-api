import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Inject,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { UserRole } from '../../../users/domain/entities/user-role.enum';
import {
  INotificationService,
  NOTIFICATION_SERVICE,
} from '../../domain/services/notification.service.interface';
import {
  NotificationLogDto,
  SendEmailDto,
  SendSmsDto,
} from '../dtos/notification.dto';
import { Role } from 'src/auth/domain/enums/role.enum';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_SERVICE)
    private notificationService: INotificationService,
  ) {}

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter notificações de um usuário específico' })
  @ApiResponse({
    status: 200,
    description: 'Notificações encontradas',
    type: [NotificationLogDto],
  })
  async getNotificationsByUser(
    @Param('userId') userId: string,
  ): Promise<NotificationLogDto[]> {
    return this.notificationService.getNotificationsByUser(userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter notificações do usuário atual' })
  @ApiResponse({
    status: 200,
    description: 'Notificações encontradas',
    type: [NotificationLogDto],
  })
  async getMyNotifications(@Request() req): Promise<NotificationLogDto[]> {
    // Aqui, req.user.id seria o ID do usuário autenticado
    // Por enquanto, usamos um ID de exemplo
    const userId = req.user?.id || 'current-user-id';
    return this.notificationService.getNotificationsByUser(userId);
  }

  @Post('email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar email' })
  @ApiResponse({ status: 200, description: 'Email enviado com sucesso' })
  async sendEmail(
    @Body() emailDto: SendEmailDto,
  ): Promise<{ success: boolean }> {
    const result = await this.notificationService.sendEmail(
      emailDto.to,
      emailDto.subject,
      emailDto.body,
    );
    return { success: result };
  }

  @Post('sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar SMS' })
  @ApiResponse({ status: 200, description: 'SMS enviado com sucesso' })
  async sendSms(@Body() smsDto: SendSmsDto): Promise<{ success: boolean }> {
    const result = await this.notificationService.sendSms(
      smsDto.to,
      smsDto.message,
    );
    return { success: result };
  }
}
