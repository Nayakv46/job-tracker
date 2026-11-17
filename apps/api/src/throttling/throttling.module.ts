import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthResolver } from '../auth/auth.resolver.js';
import { GqlThrottlerGuard } from './gql-throttler.guard.js';

const MINUTE = 60_000;

/**
 * Per-IP rate limiting:
 * - `default` applies to every resolver/route,
 * - `auth` is a stricter limit applied only to register/login/refreshToken (brute-force protection).
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: MINUTE,
            limit: Number(config.get('THROTTLE_LIMIT', 100)),
          },
          {
            name: 'auth',
            ttl: MINUTE,
            limit: Number(config.get('THROTTLE_AUTH_LIMIT', 10)),
            skipIf: (context) => context.getClass() !== AuthResolver,
          },
        ],
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class ThrottlingModule {}
