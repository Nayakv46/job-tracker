import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from './current-user.decorator.js';

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the user to the request.
 */
@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext();
    const header: string | undefined = req?.headers?.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(header.slice('Bearer '.length));
      req.user = { id: payload.sub, email: payload.email } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Not authenticated');
    }
  }
}
