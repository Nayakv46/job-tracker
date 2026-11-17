import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';
import { GqlAuthGuard } from '../auth/gql-auth.guard.js';
import { AddNoteInput } from './dto/add-note.input.js';
import { Note } from './models/note.model.js';
import { NotesService } from './notes.service.js';

@Resolver(() => Note)
@UseGuards(GqlAuthGuard)
export class NotesResolver {
  constructor(private readonly notesService: NotesService) {}

  @Mutation(() => Note)
  addNote(@CurrentUser() user: AuthUser, @Args('input') input: AddNoteInput) {
    return this.notesService.add(user.id, input);
  }

  @Mutation(() => Boolean)
  deleteNote(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ) {
    return this.notesService.remove(user.id, id);
  }
}
