import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service.js';
import { CurrentUser, type AuthUser } from './current-user.decorator.js';
import { LoginInput, RegisterInput } from './dto/auth.input.js';
import { GqlAuthGuard } from './gql-auth.guard.js';
import { AuthPayload } from './models/auth-payload.model.js';
import { User } from './models/user.model.js';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  refreshToken(
    @Args('refreshToken', { type: () => String }) refreshToken: string,
  ) {
    return this.authService.refresh(refreshToken);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
