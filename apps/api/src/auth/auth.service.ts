import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginInput, RegisterInput } from './dto/auth.input.js';
import { AuthPayload } from './models/auth-payload.model.js';
import { hashPassword, verifyPassword } from './utils/password-hashing.js';

interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register({ email, password }: RegisterInput): Promise<AuthPayload> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });

    return this.buildPayload(user);
  }

  async login({ email, password }: LoginInput): Promise<AuthPayload> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildPayload(user);
  }

  async refresh(refreshToken: string): Promise<AuthPayload> {
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    // Make sure the user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.buildPayload(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }
    return user;
  }

  private async buildPayload(user: User): Promise<AuthPayload> {
    const payload: TokenPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('REFRESH_SECRET'),
        expiresIn: this.config.get('REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken, user };
  }
}
