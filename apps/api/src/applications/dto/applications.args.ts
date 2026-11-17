import { ArgsType, Field, Int } from '@nestjs/graphql';
import { ApplicationStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@ArgsType()
export class ApplicationsArgs {
  @Field(() => ApplicationStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Case-insensitive search by position or company name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @Field(() => Int, { defaultValue: 50 })
  @IsInt()
  @Min(1)
  @Max(100)
  take: number = 50;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  skip: number = 0;
}
