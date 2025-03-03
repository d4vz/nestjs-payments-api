import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { User } from '../../../users/domain/entities/user.entity';
import { Action } from '../enums/action.enum';
import { Role } from '../enums/role.enum';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { Subscription } from '../../../subscriptions/domain/entities/subscription.entity';
import { Payment } from '../../../payments/domain/entities/payment.entity';

export type Subjects = InferSubjects<
  typeof User | typeof Plan | typeof Subscription | typeof Payment | 'all'
>;

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.roles.includes(Role.ADMIN)) {
      can(Action.CREATE, 'all');
      can(Action.READ, 'all');
      can(Action.UPDATE, 'all');
      can(Action.DELETE, 'all');
      can(Action.MANAGE, 'all');
    } else {
      can(Action.READ, User, { id: user.id });
      can(Action.UPDATE, User, { id: user.id });
    }

    return build({
      detectSubjectType: (subject) => {
        if (
          subject &&
          typeof subject === 'object' &&
          'constructor' in subject
        ) {
          return subject.constructor as ExtractSubjectType<Subjects>;
        }
        return subject as unknown as ExtractSubjectType<Subjects>;
      },
    });
  }
}
