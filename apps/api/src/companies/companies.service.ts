import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateCompanyInput } from './dto/update-company.input.js';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.company.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(userId: string, id: string, input: UpdateCompanyInput) {
    await this.findOwned(userId, id);

    try {
      return await this.prisma.company.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          website: input.website,
        },
      });
    } catch (error) {
      // Unique (userId, name) violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A company with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Deletes a company only when no applications reference it, so deleting a company
   * never silently removes applications.
   */
  async remove(userId: string, id: string): Promise<boolean> {
    await this.findOwned(userId, id);

    const applications = await this.prisma.application.count({
      where: { companyId: id },
    });
    if (applications > 0) {
      throw new ConflictException(
        'Company has applications; delete or move them first',
      );
    }

    await this.prisma.company.delete({ where: { id } });
    return true;
  }

  private async findOwned(userId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, userId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }
}
