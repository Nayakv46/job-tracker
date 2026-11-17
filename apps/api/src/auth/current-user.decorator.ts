import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Injects the authenticated user (set by GqlAuthGuard) into a resolver argument.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    GqlExecutionContext.create(context).getContext().req.user,
);
