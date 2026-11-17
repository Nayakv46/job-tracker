import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotesService } from './notes.service.js';

const USER_ID = 'user-1';

describe('NotesService', () => {
  let service: NotesService;
  const prisma = {
    application: { findFirst: vi.fn() },
    note: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [NotesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(NotesService);
  });

  it("refuses to add a note to another user's application", async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    await expect(
      service.add(USER_ID, { applicationId: 'app-1', content: 'Hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.note.create).not.toHaveBeenCalled();
  });

  it('updates a note only through an application owned by the user', async () => {
    prisma.note.updateMany.mockResolvedValue({ count: 1 });
    prisma.note.findUniqueOrThrow.mockResolvedValue({ id: 'note-1' });

    await service.update(USER_ID, { id: 'note-1', content: '  Updated  ' });

    expect(prisma.note.updateMany).toHaveBeenCalledWith({
      where: { id: 'note-1', application: { userId: USER_ID } },
      data: { content: 'Updated' },
    });
  });

  it("throws when updating a note that isn't the user's", async () => {
    prisma.note.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update(USER_ID, { id: 'note-1', content: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.note.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});
