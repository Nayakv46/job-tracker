import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  website: string | null;

  @Field(() => Date)
  createdAt: Date;
}
