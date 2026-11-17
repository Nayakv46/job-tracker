import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Application } from './application.model.js';

@ObjectType()
export class PaginatedApplications {
  @Field(() => [Application])
  items: Application[];

  @Field(() => Int, {
    description:
      'Number of applications matching the filters (ignores take/skip)',
  })
  total: number;

  @Field(() => Int)
  take: number;

  @Field(() => Int)
  skip: number;
}
