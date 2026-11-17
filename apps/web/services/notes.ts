import { graphql } from "@/gql";

export const AddNoteMutation = graphql(`
  mutation AddNote($input: AddNoteInput!) {
    addNote(input: $input) {
      id
    }
  }
`);

export const UpdateNoteMutation = graphql(`
  mutation UpdateNote($input: UpdateNoteInput!) {
    updateNote(input: $input) {
      id
    }
  }
`);

export const DeleteNoteMutation = graphql(`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`);
