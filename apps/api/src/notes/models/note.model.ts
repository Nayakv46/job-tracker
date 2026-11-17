import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Note {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  applicationId: string;

  @Field(() => String)
  content: string;

  @Field(() => Date)
  createdAt: Date;
}
