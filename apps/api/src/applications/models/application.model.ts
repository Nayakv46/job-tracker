import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ApplicationStatus } from '@prisma/client';
import { Company } from '../../companies/models/company.model.js';
import { Note } from '../../notes/models/note.model.js';

registerEnumType(ApplicationStatus, { name: 'ApplicationStatus' });

@ObjectType()
export class Application {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  position: string;

  @Field(() => String, { nullable: true })
  url: string | null;

  @Field(() => Int, { nullable: true })
  salaryMin: number | null;

  @Field(() => Int, { nullable: true })
  salaryMax: number | null;

  @Field(() => ApplicationStatus)
  status: ApplicationStatus;

  @Field(() => Date, { nullable: true })
  appliedAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Loaded eagerly with Prisma `include` to avoid N+1 queries
  @Field(() => Company)
  company: Company;

  @Field(() => [Note])
  notes: Note[];
}
