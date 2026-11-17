"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { useAddNote, useDeleteNote, useUpdateNote } from "@/hooks/useNotes";
import { getErrorMessage } from "@/lib/graphql/errors";
import { showErrorToast } from "@/lib/toasts";
import { formatRelative } from "@/lib/utils/format";

type Note = { id: string; content: string; createdAt: string };

const MAX_LENGTH = 5000;

const NoteItem = ({
  note,
  applicationId,
}: {
  note: Note;
  applicationId: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const updateNote = useUpdateNote(applicationId);
  const deleteNote = useDeleteNote(applicationId);

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    updateNote.mutate(
      { id: note.id, content: draft },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => showErrorToast(getErrorMessage(error)),
      },
    );
  };

  if (editing) {
    return (
      <li className="py-3">
        <form onSubmit={onSave} className="flex flex-col gap-2">
          <Label htmlFor={`note-${note.id}`} className="sr-only">
            Edit note
          </Label>
          <Textarea
            id={`note-${note.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_LENGTH}
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(note.content);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!draft.trim() || updateNote.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelative(note.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Edit note"
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete note"
          disabled={deleteNote.isPending}
          onClick={() =>
            deleteNote.mutate(note.id, {
              onError: (error) => showErrorToast(getErrorMessage(error)),
            })
          }
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
};

const NotesSection = ({
  applicationId,
  notes,
}: {
  applicationId: string;
  notes: Note[];
}) => {
  const [content, setContent] = useState("");
  const addNote = useAddNote(applicationId);

  const onAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    addNote.mutate(content, {
      onSuccess: () => setContent(""),
      onError: (error) => showErrorToast(getErrorMessage(error)),
    });
  };

  return (
    <section className="rounded-xl border bg-popover p-6">
      <h2 className="font-semibold">Notes</h2>

      <form onSubmit={onAdd} className="mt-4 flex flex-col gap-2">
        <Label htmlFor="new-note" className="sr-only">
          New note
        </Label>
        <Textarea
          id="new-note"
          placeholder="Interview feedback, contacts, next steps…"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_LENGTH}
          rows={3}
        />
        <Button
          type="submit"
          className="self-end"
          disabled={!content.trim() || addNote.isPending}
        >
          {addNote.isPending && <Spinner />}
          Add note
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="mt-2 divide-y">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} applicationId={applicationId} />
          ))}
        </ul>
      )}
    </section>
  );
};

export default NotesSection;
