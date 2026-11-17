import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ApplicationStatus } from '@prisma/client';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { ApplicationsService } from './applications.service.js';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
} from './dto/application.input.js';
import { ApplicationsArgs } from './dto/applications.args.js';
import { Application } from './models/application.model.js';
import { StatusCount } from './models/status-count.model.js';

@Resolver(() => Application)
@UseGuards(GqlAuthGuard)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Query(() => [Application])
  applications(@CurrentUser() user: AuthUser, @Args() args: ApplicationsArgs) {
    return this.applicationsService.findAll(user.id, args);
  }

  @Query(() => Application)
  application(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.findOne(user.id, id);
  }

  @Query(() => [StatusCount])
  stats(@CurrentUser() user: AuthUser) {
    return this.applicationsService.stats(user.id);
  }

  @Mutation(() => Application)
  createApplication(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateApplicationInput,
  ) {
    return this.applicationsService.create(user.id, input);
  }

  @Mutation(() => Application)
  updateApplication(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('input') input: UpdateApplicationInput,
  ) {
    return this.applicationsService.update(user.id, id, input);
  }

  @Mutation(() => Application)
  updateApplicationStatus(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('status', { type: () => ApplicationStatus })
    status: ApplicationStatus,
  ) {
    return this.applicationsService.updateStatus(user.id, id, status);
  }

  @Mutation(() => Boolean)
  deleteApplication(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.remove(user.id, id);
  }
}
