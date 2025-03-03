import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_SERVICE } from '../../domain/services/auth.service.interface';
import { USER_SERVICE } from '../../../users/domain/services/user.service.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';
import { LoginDto } from '../../application/dtos/login.dto';
import { SignUpDto } from '../../application/dtos/sign-up.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let userService: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    roles: [Role.USER],
  } as User;

  const mockUserWithoutPassword = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: [Role.USER],
  };

  const mockAuthResponse = {
    accessToken: 'test-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: [Role.USER],
    },
  };

  beforeEach(async () => {
    const authServiceMock = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const userServiceMock = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH_SERVICE,
          useValue: authServiceMock,
        },
        {
          provide: USER_SERVICE,
          useValue: userServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AUTH_SERVICE);
    userService = module.get(USER_SERVICE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should throw an exception if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        new HttpException('Credenciais inválidas', HttpStatus.UNAUTHORIZED),
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
    });

    it('should return token and user data if login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('signup', () => {
    it('should throw an exception if email already exists', async () => {
      const signUpDto: SignUpDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password',
      };

      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(controller.signup(signUpDto)).rejects.toThrow(
        new HttpException('Email já cadastrado', HttpStatus.CONFLICT),
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should create a new user and return token if signup is successful', async () => {
      const signUpDto: SignUpDto = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password',
      };

      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.signup(signUpDto);

      expect(result).toEqual({
        message: 'Usuário cadastrado com sucesso',
        user: mockUserWithoutPassword,
        ...mockAuthResponse,
      });

      expect(userService.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(userService.create).toHaveBeenCalledWith(signUpDto);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });
});
