import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../../common/enums/user-role.enum';
import { AuthService } from './auth.service';
import { PREDEFINED_USERS } from './constants/users.constant';

// Мокаем весь модуль bcrypt — compare становится jest.fn() автоматически
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Сбрасываем все моки перед каждым тестом
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('fake-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should return access token for valid admin credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ username: 'admin', password: 'adminpass' });

      expect(result).toEqual({ accessToken: 'fake-jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          role: UserRole.ADMIN,
        }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'admin', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      await expect(
        service.login({ username: 'nonexistent', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should have three predefined users (admin, normal, limited)', () => {
      const usernames = PREDEFINED_USERS.map((u) => u.username);
      expect(usernames).toEqual(['admin', 'normal', 'limited']);
    });
  });
});