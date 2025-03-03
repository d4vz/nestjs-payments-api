import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { LoginUserDto } from '../../application/dtos/login-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import {
  IUserService,
  USER_SERVICE,
} from '../../domain/services/user.service.interface';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';
import { CheckPolicies } from '../../../auth/infrastructure/decorators/check-policies.decorator';
import { PoliciesGuard } from '../../../auth/infrastructure/guards/policies.guard';
import { Action } from '../../../auth/domain/enums/action.enum';
import { AppAbility } from '../../../auth/domain/ability/ability.factory';
import { User } from '../../domain/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, User))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const { password, ...result } = user;
    return result;
  }

  @Post()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.CREATE, User))
  async create(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
      );
    }
    const user = await this.userService.create(createUserDto);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.UPDATE, User))
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userService.findByEmail(
        updateUserDto.email,
      );
      if (existingUser) {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatedUser = await this.userService.update(id, updateUserDto);
    const { password, ...result } = updatedUser;
    return result;
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.DELETE, User))
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const deleted = await this.userService.delete(id);

    if (!deleted) {
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { message: 'User deleted successfully' };
  }
}
