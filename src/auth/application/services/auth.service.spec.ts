import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { USER_SERVICE } from '../../../users/domain/services/user.service.interface';
import { AbilityFactory } from '../../domain/ability/ability.factory';
import { User } from '../../../users/domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: any;
  let abilityFactory: AbilityFactory;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    roles: [Role.USER],
  } as User;

  beforeEach(async () => {
    const userServiceMock = {
      findByEmail: jest.fn(),
    };

    const jwtServiceMock = {
      sign: jest.fn().mockReturnValue('test-token'),
      verify: jest.fn().mockReturnValue({
        sub: '1',
        email: 'test@example.com',
        roles: [Role.USER],
      }),
    };

    const abilityFactoryMock = {
      createForUser: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_SERVICE,
          useValue: userServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: AbilityFactory,
          useValue: abilityFactoryMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get(USER_SERVICE);
    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if user is not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
    });

    it('should return user if credentials are valid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          roles: [Role.USER],
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: '1',
        roles: [Role.USER],
      });
    });
  });

  describe('validateToken', () => {
    it('should verify and return token payload', async () => {
      const result = await service.validateToken('test-token');

      expect(result).toEqual({
        sub: '1',
        email: 'test@example.com',
        roles: [Role.USER],
      });

      expect(jwtService.verify).toHaveBeenCalledWith('test-token');
    });
  });

  describe('getAbility', () => {
    it('should create and return ability for user', () => {
      const result = service.getAbility(mockUser);

      expect(result).toEqual({});
      expect(abilityFactory.createForUser).toHaveBeenCalledWith(mockUser);
    });
  });
});
