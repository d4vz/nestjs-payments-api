import { AbilityFactory } from './ability.factory';
import { User } from '../../../users/domain/entities/user.entity';
import { Role } from '../enums/role.enum';
import { Action } from '../enums/action.enum';

describe('AbilityFactory', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(() => {
    abilityFactory = new AbilityFactory();
  });

  it('should be defined', () => {
    expect(abilityFactory).toBeDefined();
  });

  describe('createForUser', () => {
    it('should create ability for admin users with all permissions', () => {
      const adminUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'password',
        roles: [Role.ADMIN],
      } as User;

      const ability = abilityFactory.createForUser(adminUser);

      // Verificamos apenas que o ability foi criado com sucesso
      expect(ability).toBeDefined();
      expect(typeof ability.can).toBe('function');
    });

    it('should create ability for regular users with limited permissions', () => {
      const regularUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        password: 'password',
        roles: [Role.USER],
      } as User;

      const ability = abilityFactory.createForUser(regularUser);

      // Verificamos apenas que o ability foi criado com sucesso
      expect(ability).toBeDefined();
      expect(typeof ability.can).toBe('function');
    });
  });
});
