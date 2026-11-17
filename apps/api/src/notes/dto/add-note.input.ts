import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class AddNoteInput {
  @Field(() => ID)
  @IsUUID()
  applicationId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
