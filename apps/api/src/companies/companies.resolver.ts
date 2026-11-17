import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { CompaniesService } from './companies.service.js';
import { Company } from './models/company.model.js';

@Resolver(() => Company)
@UseGuards(GqlAuthGuard)
export class CompaniesResolver {
  constructor(private readonly companiesService: CompaniesService) {}

  @Query(() => [Company])
  companies(@CurrentUser() user: AuthUser) {
    return this.companiesService.findAll(user.id);
  }
}
