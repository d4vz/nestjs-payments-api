import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UsersController } from './users.controller';
import { USER_SERVICE } from '../../domain/services/user.service.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../../auth/domain/enums/role.enum';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { PoliciesGuard } from '../../../auth/infrastructure/guards/policies.guard';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
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

  beforeEach(async () => {
    const userServiceMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: USER_SERVICE,
          useValue: userServiceMock,
        },
      ],
    })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    userService = module.get(USER_SERVICE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [mockUser, { ...mockUser, id: '2' }];
      userService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual([
        mockUserWithoutPassword,
        { ...mockUserWithoutPassword, id: '2' },
      ]);
      expect(userService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUserWithoutPassword);
      expect(userService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an exception if user is not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(userService.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('create', () => {
    it('should create and return a new user without password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue({
        ...createUserDto,
        id: '2',
        password: 'hashedPassword',
        roles: [Role.USER],
      });

      const result = await controller.create(createUserDto);

      expect(result).toEqual({
        id: '2',
        email: 'new@example.com',
        name: 'New User',
        roles: [Role.USER],
      });
      expect(userService.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an exception if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123',
      };

      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return a user without password', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      userService.findById.mockResolvedValue(mockUser);
      userService.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await controller.update('1', updateUserDto);

      expect(result).toEqual({
        ...mockUserWithoutPassword,
        name: 'Updated Name',
      });
      expect(userService.findById).toHaveBeenCalledWith('1');
      expect(userService.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should throw an exception if user is not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      userService.findById.mockResolvedValue(null);

      await expect(controller.update('999', updateUserDto)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(userService.findById).toHaveBeenCalledWith('999');
      expect(userService.update).not.toHaveBeenCalled();
    });

    it('should throw an exception if email already exists', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      userService.findById.mockResolvedValue(mockUser);
      userService.findByEmail.mockResolvedValue({ ...mockUser, id: '2' });

      await expect(controller.update('1', updateUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        ),
      );
      expect(userService.findById).toHaveBeenCalledWith('1');
      expect(userService.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
      expect(userService.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user and return success message', async () => {
      userService.findById.mockResolvedValue(mockUser);
      userService.delete.mockResolvedValue(true);

      const result = await controller.remove('1');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(userService.findById).toHaveBeenCalledWith('1');
      expect(userService.delete).toHaveBeenCalledWith('1');
    });

    it('should throw an exception if user is not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.remove('999')).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
      expect(userService.findById).toHaveBeenCalledWith('999');
      expect(userService.delete).not.toHaveBeenCalled();
    });

    it('should throw an exception if deletion fails', async () => {
      userService.findById.mockResolvedValue(mockUser);
      userService.delete.mockResolvedValue(false);

      await expect(controller.remove('1')).rejects.toThrow(
        new HttpException(
          'Failed to delete user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
      expect(userService.findById).toHaveBeenCalledWith('1');
      expect(userService.delete).toHaveBeenCalledWith('1');
    });
  });
});
