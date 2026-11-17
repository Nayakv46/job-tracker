import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationsService } from './applications.service.js';

const USER_ID = 'user-1';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  const prisma = {
    application: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    company: { upsert: vi.fn() },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ApplicationsService);
  });

  describe('findAll', () => {
    it('scopes by user and searches position and company name', async () => {
      prisma.application.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID, {
        status: ApplicationStatus.APPLIED,
        search: '  acme ',
        take: 10,
        skip: 20,
      });

      const query = prisma.application.findMany.mock.calls[0][0];
      expect(query.where).toEqual({
        userId: USER_ID,
        status: ApplicationStatus.APPLIED,
        OR: [
          { position: { contains: 'acme', mode: 'insensitive' } },
          { company: { name: { contains: 'acme', mode: 'insensitive' } } },
        ],
      });
      expect(query).toMatchObject({ take: 10, skip: 20 });
      // Relations are included in the same query (no N+1)
      expect(query.include).toHaveProperty('company', true);
      expect(query.include).toHaveProperty('notes');
    });

    it('returns the page together with the total count for the same filters', async () => {
      const items = [{ id: 'app-1' }];
      prisma.application.findMany.mockResolvedValue(items);
      prisma.application.count.mockResolvedValue(42);

      const result = await service.findAll(USER_ID, {
        status: ApplicationStatus.OFFER,
        take: 1,
        skip: 5,
      });

      expect(result).toEqual({ items, total: 42, take: 1, skip: 5 });
      expect(prisma.application.count).toHaveBeenCalledWith({
        where: prisma.application.findMany.mock.calls[0][0].where,
      });
    });

    it('omits the search filter when no phrase is given', async () => {
      prisma.application.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID, { take: 50, skip: 0 });

      expect(
        prisma.application.findMany.mock.calls[0][0].where,
      ).not.toHaveProperty('OR');
    });
  });

  describe('create', () => {
    it('rejects salaryMin greater than salaryMax', async () => {
      await expect(
        service.create(USER_ID, {
          companyName: 'Acme',
          position: 'Dev',
          salaryMin: 20000,
          salaryMax: 10000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });

    it('reuses or creates the company and defaults to WISHLIST', async () => {
      prisma.company.upsert.mockResolvedValue({ id: 'company-1' });
      prisma.application.create.mockResolvedValue({});

      await service.create(USER_ID, {
        companyName: ' Acme ',
        position: 'Dev',
      });

      expect(prisma.company.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_name: { userId: USER_ID, name: 'Acme' } },
        }),
      );
      expect(prisma.application.create.mock.calls[0][0].data).toMatchObject({
        userId: USER_ID,
        companyId: 'company-1',
        status: ApplicationStatus.WISHLIST,
        appliedAt: null,
      });
    });

    it('sets appliedAt when created with a non-wishlist status', async () => {
      prisma.company.upsert.mockResolvedValue({ id: 'company-1' });
      prisma.application.create.mockResolvedValue({});

      await service.create(USER_ID, {
        companyName: 'Acme',
        position: 'Dev',
        status: ApplicationStatus.APPLIED,
      });

      expect(
        prisma.application.create.mock.calls[0][0].data.appliedAt,
      ).toBeInstanceOf(Date);
    });
  });

  describe('updateStatus', () => {
    it("throws when the application doesn't belong to the user", async () => {
      prisma.application.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(USER_ID, 'app-1', ApplicationStatus.OFFER),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.application.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'app-1', userId: USER_ID } }),
      );
      expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('keeps the original appliedAt date', async () => {
      const appliedAt = new Date('2026-01-01');
      prisma.application.findFirst.mockResolvedValue({
        id: 'app-1',
        appliedAt,
      });
      prisma.application.update.mockResolvedValue({});

      await service.updateStatus(USER_ID, 'app-1', ApplicationStatus.INTERVIEW);

      expect(prisma.application.update.mock.calls[0][0].data).toEqual({
        status: ApplicationStatus.INTERVIEW,
        appliedAt,
      });
    });
  });

  describe('remove', () => {
    it('throws when nothing was deleted', async () => {
      prisma.application.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(USER_ID, 'app-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('stats', () => {
    it('returns a count for every status, including zeros', async () => {
      prisma.application.groupBy.mockResolvedValue([
        { status: ApplicationStatus.APPLIED, _count: { _all: 3 } },
        { status: ApplicationStatus.OFFER, _count: { _all: 1 } },
      ]);

      await expect(service.stats(USER_ID)).resolves.toEqual([
        { status: ApplicationStatus.WISHLIST, count: 0 },
        { status: ApplicationStatus.APPLIED, count: 3 },
        { status: ApplicationStatus.INTERVIEW, count: 0 },
        { status: ApplicationStatus.OFFER, count: 1 },
        { status: ApplicationStatus.REJECTED, count: 0 },
      ]);
    });
  });
});
