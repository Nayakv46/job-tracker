import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

@InputType()
export class UpdateCompanyInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Pass null to clear the website',
  })
  // `null` clears the website, `undefined` leaves it unchanged
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl()
  website?: string | null;
}
