import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddNoteInput } from './dto/add-note.input.js';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, { applicationId, content }: AddNoteInput) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.note.create({
      data: { applicationId, content: content.trim() },
    });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    // Ownership is checked through the parent application
    const { count } = await this.prisma.note.deleteMany({
      where: { id, application: { userId } },
    });
    if (count === 0) {
      throw new NotFoundException('Note not found');
    }
    return true;
  }
}
