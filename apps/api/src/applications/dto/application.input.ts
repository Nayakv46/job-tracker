import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { ApplicationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateApplicationInput {
  @Field(() => String, {
    description:
      'Company name; an existing company with this name is reused, otherwise it is created',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  companyName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  companyWebsite?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  position: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  url?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  appliedAt?: Date;
}

@InputType()
export class UpdateApplicationInput extends PartialType(
  CreateApplicationInput,
) {}
