import { User } from '../../../users/domain/entities/user.entity';
import { AppAbility } from '../ability/ability.factory';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
  validateUser(email: string, password: string): Promise<User | null>;
  login(user: User): Promise<{ accessToken: string; user: any }>;
  validateToken(token: string): Promise<any>;
  getAbility(user: User): AppAbility;
}
