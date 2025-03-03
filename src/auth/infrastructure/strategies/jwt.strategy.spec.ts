import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from '../constants';

// Mockando o PassportStrategy e Strategy
jest.mock('@nestjs/passport', () => ({
  PassportStrategy: jest.fn().mockImplementation((Strategy) => {
    return class {
      options: any;
      constructor(options) {
        this.options = options;
      }
    };
  }),
}));

jest.mock('passport-jwt', () => ({
  Strategy: jest.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest
      .fn()
      .mockReturnValue('bearer_token_extractor'),
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data from payload', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        roles: ['user'],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        roles: ['user'],
      });
    });
  });
});
