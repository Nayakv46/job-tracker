import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
} from './dto/application.input.js';
import { ApplicationsArgs } from './dto/applications.args.js';
import { StatusCount } from './models/status-count.model.js';

// Relations resolved in the same query (no N+1)
const applicationInclude = {
  company: true,
  notes: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.ApplicationInclude;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, { status, search, take, skip }: ApplicationsArgs) {
    const term = search?.trim();

    return this.prisma.application.findMany({
      where: {
        userId,
        status,
        ...(term && {
          OR: [
            { position: { contains: term, mode: 'insensitive' } },
            { company: { name: { contains: term, mode: 'insensitive' } } },
          ],
        }),
      },
      include: applicationInclude,
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    });
  }

  async findOne(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: applicationInclude,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async create(userId: string, input: CreateApplicationInput) {
    assertSalaryRange(input.salaryMin, input.salaryMax);

    const company = await this.upsertCompany(
      userId,
      input.companyName,
      input.companyWebsite,
    );
    const status = input.status ?? ApplicationStatus.WISHLIST;

    return this.prisma.application.create({
      data: {
        userId,
        companyId: company.id,
        position: input.position.trim(),
        url: input.url,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        status,
        appliedAt:
          input.appliedAt ??
          (status === ApplicationStatus.WISHLIST ? null : new Date()),
      },
      include: applicationInclude,
    });
  }

  async update(userId: string, id: string, input: UpdateApplicationInput) {
    const existing = await this.findOne(userId, id);
    assertSalaryRange(
      input.salaryMin ?? existing.salaryMin,
      input.salaryMax ?? existing.salaryMax,
    );

    const companyId = input.companyName
      ? (
          await this.upsertCompany(
            userId,
            input.companyName,
            input.companyWebsite,
          )
        ).id
      : undefined;

    return this.prisma.application.update({
      where: { id },
      data: {
        companyId,
        position: input.position?.trim(),
        url: input.url,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        // `null` from GraphQL means "not provided" for required columns
        status: input.status ?? undefined,
        appliedAt: input.appliedAt,
      },
      include: applicationInclude,
    });
  }

  async updateStatus(userId: string, id: string, status: ApplicationStatus) {
    const existing = await this.findOne(userId, id);

    return this.prisma.application.update({
      where: { id },
      data: {
        status,
        // First move out of the wishlist marks the application as sent
        appliedAt:
          existing.appliedAt ??
          (status === ApplicationStatus.WISHLIST ? null : new Date()),
      },
      include: applicationInclude,
    });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.application.deleteMany({
      where: { id, userId },
    });
    if (count === 0) {
      throw new NotFoundException('Application not found');
    }
    return true;
  }

  async stats(userId: string): Promise<StatusCount[]> {
    const groups = await this.prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    // Always return every status, including the ones with zero applications
    return Object.values(ApplicationStatus).map((status) => ({
      status,
      count: groups.find((g) => g.status === status)?._count._all ?? 0,
    }));
  }

  private upsertCompany(userId: string, name: string, website?: string) {
    const trimmed = name.trim();
    return this.prisma.company.upsert({
      where: { userId_name: { userId, name: trimmed } },
      create: { userId, name: trimmed, website },
      update: website ? { website } : {},
    });
  }
}

function assertSalaryRange(min?: number | null, max?: number | null) {
  if (min != null && max != null && min > max) {
    throw new BadRequestException('salaryMin cannot be greater than salaryMax');
  }
}
