import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PoliciesGuard } from './policies.guard';
import { AbilityFactory } from '../../domain/ability/ability.factory';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';
import { User } from '../../../users/domain/entities/user.entity';
import { Role } from '../../domain/enums/role.enum';

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: Reflector;
  let abilityFactory: AbilityFactory;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: [Role.USER],
  } as User;

  const mockAbility = {
    can: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AbilityFactory,
          useValue: {
            createForUser: jest.fn().mockReturnValue(mockAbility),
          },
        },
      ],
    }).compile();

    guard = module.get<PoliciesGuard>(PoliciesGuard);
    reflector = module.get<Reflector>(Reflector);
    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    let mockHandler: jest.Mock;

    beforeEach(() => {
      mockHandler = jest.fn();
      mockContext = {
        getHandler: jest.fn().mockReturnValue(mockHandler),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: mockUser,
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true if no policy handlers are defined', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue([]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(
        CHECK_POLICIES_KEY,
        mockHandler,
      );
    });

    it('should throw ForbiddenException if user is not authenticated', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue([jest.fn()]);
      mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
        user: null,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('Usuário não autenticado'),
      );
    });

    it('should return true if all policy handlers pass', async () => {
      const policyHandler1 = jest.fn().mockReturnValue(true);
      const policyHandler2 = jest.fn().mockReturnValue(true);

      jest
        .spyOn(reflector, 'get')
        .mockReturnValue([policyHandler1, policyHandler2]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(abilityFactory.createForUser).toHaveBeenCalledWith(mockUser);
      expect(policyHandler1).toHaveBeenCalledWith(mockAbility);
      expect(policyHandler2).toHaveBeenCalledWith(mockAbility);
    });

    it('should return false if any policy handler fails', async () => {
      const policyHandler1 = jest.fn().mockReturnValue(true);
      const policyHandler2 = jest.fn().mockReturnValue(false);

      jest
        .spyOn(reflector, 'get')
        .mockReturnValue([policyHandler1, policyHandler2]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(abilityFactory.createForUser).toHaveBeenCalledWith(mockUser);
      expect(policyHandler1).toHaveBeenCalledWith(mockAbility);
      expect(policyHandler2).toHaveBeenCalledWith(mockAbility);
    });

    it('should handle object-style policy handlers', async () => {
      const policyHandler = {
        handle: jest.fn().mockReturnValue(true),
      };

      jest.spyOn(reflector, 'get').mockReturnValue([policyHandler]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(abilityFactory.createForUser).toHaveBeenCalledWith(mockUser);
      expect(policyHandler.handle).toHaveBeenCalledWith(mockAbility);
    });
  });
});
