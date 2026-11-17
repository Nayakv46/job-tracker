import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CompaniesService } from './companies.service.js';

const USER_ID = 'user-1';
const company = { id: 'company-1', userId: USER_ID, name: 'Acme' };

describe('CompaniesService', () => {
  let service: CompaniesService;
  const prisma = {
    company: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    application: { count: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CompaniesService);
  });

  describe('update', () => {
    it("throws when the company doesn't belong to the user", async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.update(USER_ID, 'company-1', { name: 'New' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.company.findFirst).toHaveBeenCalledWith({
        where: { id: 'company-1', userId: USER_ID },
      });
      expect(prisma.company.update).not.toHaveBeenCalled();
    });

    it('maps a duplicate name to a conflict', async () => {
      prisma.company.findFirst.mockResolvedValue(company);
      prisma.company.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.update(USER_ID, 'company-1', { name: 'Taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('trims the name and allows clearing the website', async () => {
      prisma.company.findFirst.mockResolvedValue(company);
      prisma.company.update.mockResolvedValue(company);

      await service.update(USER_ID, 'company-1', {
        name: '  Acme Corp ',
        website: null,
      });

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-1' },
        data: { name: 'Acme Corp', website: null },
      });
    });
  });

  describe('remove', () => {
    it('refuses to delete a company that still has applications', async () => {
      prisma.company.findFirst.mockResolvedValue(company);
      prisma.application.count.mockResolvedValue(2);

      await expect(service.remove(USER_ID, 'company-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.company.delete).not.toHaveBeenCalled();
    });

    it('deletes a company without applications', async () => {
      prisma.company.findFirst.mockResolvedValue(company);
      prisma.application.count.mockResolvedValue(0);

      await expect(service.remove(USER_ID, 'company-1')).resolves.toBe(true);
      expect(prisma.company.delete).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
    });
  });
});
