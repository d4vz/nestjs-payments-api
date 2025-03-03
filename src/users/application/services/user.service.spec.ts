import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../../auth/domain/enums/role.enum';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    roles: [Role.USER],
  } as User;

  beforeEach(async () => {
    const userRepositoryMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(USER_REPOSITORY);

    // Mock do bcrypt
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser];
      userRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return null if user is not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result).toBeNull();
      expect(userRepository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should return null if user is not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });
  });

  describe('create', () => {
    it('should create and return a new user with hashed password', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      };

      const createdUser = {
        ...userData,
        id: '2',
        password: 'hashedPassword',
        roles: [Role.USER],
      } as User;

      userRepository.create.mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result).toEqual(createdUser);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
          password: 'hashedPassword',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update and return a user', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      };

      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateData);

      expect(result).toEqual(updatedUser);
      expect(userRepository.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should hash password if provided in update data', async () => {
      const updateData = {
        password: 'newPassword',
      };

      userRepository.update.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });

      await service.update('1', updateData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 'salt');
      expect(userRepository.update).toHaveBeenCalledWith('1', {
        password: 'hashedPassword',
      });
    });
  });

  describe('delete', () => {
    it('should delete a user and return true if successful', async () => {
      userRepository.delete.mockResolvedValue(true);

      const result = await service.delete('1');

      expect(result).toBe(true);
      expect(userRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should return false if deletion fails', async () => {
      userRepository.delete.mockResolvedValue(false);

      const result = await service.delete('999');

      expect(result).toBe(false);
      expect(userRepository.delete).toHaveBeenCalledWith('999');
    });
  });
});
