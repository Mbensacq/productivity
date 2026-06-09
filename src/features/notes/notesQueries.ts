import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as notesRepo from '@/db/notesRepo';
import { replaceNoteLinks } from '@/db/noteLinksRepo';
import type { Note, NoteInput } from '@/db/noteMapping';
import { computeNoteTags, resolveBodyLinkTargets } from '@/domain/noteMetadata';
import { logError } from '@/lib/logger';
import { notesKeys } from './queryKeys';

export function useNotesQuery() {
  return useQuery({ queryKey: notesKeys.list(), queryFn: notesRepo.listNotes });
}

function cachedNotes(queryClient: QueryClient): Note[] {
  return queryClient.getQueryData<Note[]>(notesKeys.list()) ?? [];
}

/** Recomputes and persists the note's outgoing links. Best-effort (logged). */
async function syncNoteLinks(queryClient: QueryClient, note: Note): Promise<void> {
  try {
    const targets = resolveBodyLinkTargets(note.body, cachedNotes(queryClient));
    await replaceNoteLinks(note.id, targets);
  } catch (error) {
    logError(error, { scope: 'syncNoteLinks', noteId: note.id });
  }
}

function applyPatch(note: Note, patch: NoteInput): Note {
  return {
    ...note,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.body !== undefined ? { body: patch.body } : {}),
    ...(patch.frontmatter !== undefined ? { frontmatter: patch.frontmatter } : {}),
    ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
    ...(patch.isDaily !== undefined ? { isDaily: patch.isDaily } : {}),
    ...(patch.dailyDate !== undefined ? { dailyDate: patch.dailyDate } : {}),
  };
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteInput) =>
      notesRepo.createNote({ ...input, tags: computeNoteTags(input.body ?? '') }),
    onSuccess: async (note) => {
      queryClient.setQueryData<Note[]>(notesKeys.list(), (prev) => [note, ...(prev ?? [])]);
      await syncNoteLinks(queryClient, note);
    },
  });
}

interface UpdateVars {
  id: string;
  patch: NoteInput;
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateVars) =>
      notesRepo.updateNote(
        id,
        patch.body !== undefined ? { ...patch, tags: computeNoteTags(patch.body) } : patch,
      ),
    onMutate: async ({ id, patch }: UpdateVars) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.list() });
      const previous = queryClient.getQueryData<Note[]>(notesKeys.list());
      queryClient.setQueryData<Note[]>(notesKeys.list(), (prev) =>
        (prev ?? []).map((note) => (note.id === id ? applyPatch(note, patch) : note)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      logError(error, { scope: 'updateNote' });
      if (context?.previous) {
        queryClient.setQueryData(notesKeys.list(), context.previous);
      }
    },
    onSuccess: async (note) => {
      queryClient.setQueryData<Note[]>(notesKeys.list(), (prev) =>
        (prev ?? []).map((existing) => (existing.id === note.id ? note : existing)),
      );
      await syncNoteLinks(queryClient, note);
    },
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesRepo.deleteNote(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.list() });
      const previous = queryClient.getQueryData<Note[]>(notesKeys.list());
      queryClient.setQueryData<Note[]>(notesKeys.list(), (prev) =>
        (prev ?? []).filter((note) => note.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      logError(error, { scope: 'deleteNote' });
      if (context?.previous) {
        queryClient.setQueryData(notesKeys.list(), context.previous);
      }
    },
  });
}
