import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { CompaniesService } from './companies.service.js';
import { UpdateCompanyInput } from './dto/update-company.input.js';
import { Company } from './models/company.model.js';

@Resolver(() => Company)
@UseGuards(GqlAuthGuard)
export class CompaniesResolver {
  constructor(private readonly companiesService: CompaniesService) {}

  @Query(() => [Company])
  companies(@CurrentUser() user: AuthUser) {
    return this.companiesService.findAll(user.id);
  }

  @Mutation(() => Company)
  updateCompany(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('input') input: UpdateCompanyInput,
  ) {
    return this.companiesService.update(user.id, id, input);
  }

  @Mutation(() => Boolean, {
    description: 'Fails with CONFLICT while the company still has applications',
  })
  deleteCompany(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ) {
    return this.companiesService.remove(user.id, id);
  }
}
