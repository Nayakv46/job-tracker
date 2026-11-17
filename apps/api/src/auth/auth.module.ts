import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver.js';
import { AuthService } from './auth.service.js';
import { GqlAuthGuard } from './gql-auth.guard.js';

// Global so that GqlAuthGuard (and its JwtService) is usable in every feature module.
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, GqlAuthGuard],
  exports: [GqlAuthGuard, JwtModule],
})
export class AuthModule {}
