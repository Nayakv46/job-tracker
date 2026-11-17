import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApplicationStatus } from '@prisma/client';

@ObjectType()
export class StatusCount {
  @Field(() => ApplicationStatus)
  status: ApplicationStatus;

  @Field(() => Int)
  count: number;
}
