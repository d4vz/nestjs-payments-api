import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  IUserService,
  USER_SERVICE,
} from '../../../users/domain/services/user.service.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { IAuthService } from '../../domain/services/auth.service.interface';
import { AbilityFactory } from '../../domain/ability/ability.factory';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
    private readonly jwtService: JwtService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }

  async validateToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }

  getAbility(user: User) {
    return this.abilityFactory.createForUser(user);
  }
}
