import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './utils/password-hashing.js';

const config: Record<string, string> = {
  JWT_SECRET: 'test-access-secret',
  REFRESH_SECRET: 'test-refresh-secret',
};

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;
  const prisma = {
    user: { findUnique: vi.fn(), create: vi.fn() },
  };

  const user = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'jane@example.com',
    passwordHash: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    user.passwordHash = await hashPassword('password123');
  });

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: config.JWT_SECRET }),
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => config[key] ?? fallback,
            getOrThrow: (key: string) => config[key],
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  describe('register', () => {
    it('throws when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.register({ email: user.email, password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('stores a hashed password and returns a token pair', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        ...user,
        ...data,
      }));

      const result = await service.register({
        email: user.email,
        password: 'password123',
      });

      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data.passwordHash).not.toBe('password123');
      expect(data.passwordHash).toMatch(/^\$argon2id\$/);

      const access = await jwt.verifyAsync(result.accessToken);
      expect(access).toMatchObject({ sub: user.id, email: user.email });
      await expect(
        jwt.verifyAsync(result.refreshToken, { secret: config.REFRESH_SECRET }),
      ).resolves.toMatchObject({ sub: user.id });
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.login({
        email: user.email,
        password: 'password123',
      });

      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toEqual(expect.any(String));
    });
  });

  describe('refresh', () => {
    it('rejects an access token used as a refresh token', async () => {
      const accessToken = await jwt.signAsync({
        sub: user.id,
        email: user.email,
      });

      await expect(service.refresh(accessToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('issues new tokens for a valid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      const refreshToken = await jwt.signAsync(
        { sub: user.id, email: user.email },
        { secret: config.REFRESH_SECRET },
      );

      const result = await service.refresh(refreshToken);

      expect(result.user.email).toBe(user.email);
    });
  });
});
