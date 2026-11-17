import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class UpdateNoteInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
