import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from '../../application/dtos/login.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';
import {
  AUTH_SERVICE,
  IAuthService,
} from '../../domain/services/auth.service.interface';
import {
  IUserService,
  USER_SERVICE,
} from '../../../users/domain/services/user.service.interface';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    const existingUser = await this.userService.findByEmail(signUpDto.email);

    if (existingUser) {
      throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);
    }

    const user = await this.userService.create(signUpDto);

    const { password, ...userWithoutPassword } = user;
    const auth = await this.authService.login(user);

    return {
      message: 'Usuário cadastrado com sucesso',
      user: userWithoutPassword,
      ...auth,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new HttpException('Credenciais inválidas', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.login(user);
  }
}
