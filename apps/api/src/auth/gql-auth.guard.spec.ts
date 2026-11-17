import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { JwtService } from '@nestjs/jwt';
import { GqlAuthGuard } from './gql-auth.guard.js';

function gqlContext(headers: Record<string, string>) {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  // GraphQL resolver args: [root, args, context, info]
  const context = new ExecutionContextHost([{}, {}, { req }, {}]);
  context.setType('graphql');
  return { context, req };
}

describe('GqlAuthGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  const guard = new GqlAuthGuard(jwt);

  it('rejects requests without a bearer token', async () => {
    const { context } = gqlContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = await new JwtService({ secret: 'other' }).signAsync({
      sub: 'id',
      email: 'a@b.c',
    });
    const { context } = gqlContext({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the user to the request for a valid token', async () => {
    const token = await jwt.signAsync({ sub: 'user-id', email: 'a@b.c' });
    const { context, req } = gqlContext({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toEqual({ id: 'user-id', email: 'a@b.c' });
  });
});
