/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type AddNoteInput = {
  applicationId: string | number;
  content: string;
};

export type ApplicationStatus =
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WISHLIST';

export type CreateApplicationInput = {
  appliedAt?: string | null | undefined;
  /** Company name; an existing company with this name is reused, otherwise it is created */
  companyName: string;
  companyWebsite?: string | null | undefined;
  position: string;
  salaryMax?: number | null | undefined;
  salaryMin?: number | null | undefined;
  status?: ApplicationStatus | null | undefined;
  url?: string | null | undefined;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
};

export type UpdateApplicationInput = {
  appliedAt?: string | null | undefined;
  /** Company name; an existing company with this name is reused, otherwise it is created */
  companyName?: string | null | undefined;
  companyWebsite?: string | null | undefined;
  position?: string | null | undefined;
  salaryMax?: number | null | undefined;
  salaryMin?: number | null | undefined;
  status?: ApplicationStatus | null | undefined;
  url?: string | null | undefined;
};

export type UpdateCompanyInput = {
  name?: string | null | undefined;
  /** Pass null to clear the website */
  website?: string | null | undefined;
};

export type UpdateNoteInput = {
  content: string;
  id: string | number;
};

export type ApplicationFieldsFragment = { id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, company: { id: string, name: string, website: string | null } };

export type ApplicationsQueryVariables = Exact<{
  status?: ApplicationStatus | null | undefined;
  search?: string | null | undefined;
  take?: number | null | undefined;
  skip?: number | null | undefined;
}>;


export type ApplicationsQuery = { applications: { total: number, take: number, skip: number, items: Array<{ id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, company: { id: string, name: string, website: string | null } }> } };

export type ApplicationQueryVariables = Exact<{
  id: string | number;
}>;


export type ApplicationQuery = { application: { id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, notes: Array<{ id: string, content: string, createdAt: string }>, company: { id: string, name: string, website: string | null } } };

export type DashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardQuery = { stats: Array<{ status: ApplicationStatus, count: number }>, recent: { total: number, items: Array<{ id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, company: { id: string, name: string, website: string | null } }> } };

export type CreateApplicationMutationVariables = Exact<{
  input: CreateApplicationInput;
}>;


export type CreateApplicationMutation = { createApplication: { id: string } };

export type UpdateApplicationMutationVariables = Exact<{
  id: string | number;
  input: UpdateApplicationInput;
}>;


export type UpdateApplicationMutation = { updateApplication: { id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, company: { id: string, name: string, website: string | null } } };

export type UpdateApplicationStatusMutationVariables = Exact<{
  id: string | number;
  status: ApplicationStatus;
}>;


export type UpdateApplicationStatusMutation = { updateApplicationStatus: { id: string, position: string, url: string | null, salaryMin: number | null, salaryMax: number | null, status: ApplicationStatus, appliedAt: string | null, createdAt: string, updatedAt: string, company: { id: string, name: string, website: string | null } } };

export type DeleteApplicationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteApplicationMutation = { deleteApplication: boolean };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { accessToken: string, refreshToken: string, user: { id: string, email: string } } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { register: { accessToken: string, refreshToken: string, user: { id: string, email: string } } };

export type RefreshTokenMutationVariables = Exact<{
  refreshToken: string;
}>;


export type RefreshTokenMutation = { refreshToken: { accessToken: string, refreshToken: string } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string } };

export type CompaniesQueryVariables = Exact<{ [key: string]: never; }>;


export type CompaniesQuery = { companies: Array<{ id: string, name: string, website: string | null }> };

export type UpdateCompanyMutationVariables = Exact<{
  id: string | number;
  input: UpdateCompanyInput;
}>;


export type UpdateCompanyMutation = { updateCompany: { id: string, name: string, website: string | null } };

export type DeleteCompanyMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteCompanyMutation = { deleteCompany: boolean };

export type AddNoteMutationVariables = Exact<{
  input: AddNoteInput;
}>;


export type AddNoteMutation = { addNote: { id: string } };

export type UpdateNoteMutationVariables = Exact<{
  input: UpdateNoteInput;
}>;


export type UpdateNoteMutation = { updateNote: { id: string } };

export type DeleteNoteMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteNoteMutation = { deleteNote: boolean };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const ApplicationFieldsFragmentDoc = new TypedDocumentString(`
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}
    `, {"fragmentName":"ApplicationFields"}) as unknown as TypedDocumentString<ApplicationFieldsFragment, unknown>;
export const ApplicationsDocument = new TypedDocumentString(`
    query Applications($status: ApplicationStatus, $search: String, $take: Int, $skip: Int) {
  applications(status: $status, search: $search, take: $take, skip: $skip) {
    total
    take
    skip
    items {
      ...ApplicationFields
    }
  }
}
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}`) as unknown as TypedDocumentString<ApplicationsQuery, ApplicationsQueryVariables>;
export const ApplicationDocument = new TypedDocumentString(`
    query Application($id: ID!) {
  application(id: $id) {
    ...ApplicationFields
    notes {
      id
      content
      createdAt
    }
  }
}
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}`) as unknown as TypedDocumentString<ApplicationQuery, ApplicationQueryVariables>;
export const DashboardDocument = new TypedDocumentString(`
    query Dashboard {
  stats {
    status
    count
  }
  recent: applications(take: 5) {
    total
    items {
      ...ApplicationFields
    }
  }
}
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}`) as unknown as TypedDocumentString<DashboardQuery, DashboardQueryVariables>;
export const CreateApplicationDocument = new TypedDocumentString(`
    mutation CreateApplication($input: CreateApplicationInput!) {
  createApplication(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<CreateApplicationMutation, CreateApplicationMutationVariables>;
export const UpdateApplicationDocument = new TypedDocumentString(`
    mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
  updateApplication(id: $id, input: $input) {
    ...ApplicationFields
  }
}
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}`) as unknown as TypedDocumentString<UpdateApplicationMutation, UpdateApplicationMutationVariables>;
export const UpdateApplicationStatusDocument = new TypedDocumentString(`
    mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {
  updateApplicationStatus(id: $id, status: $status) {
    ...ApplicationFields
  }
}
    fragment ApplicationFields on Application {
  id
  position
  url
  salaryMin
  salaryMax
  status
  appliedAt
  createdAt
  updatedAt
  company {
    id
    name
    website
  }
}`) as unknown as TypedDocumentString<UpdateApplicationStatusMutation, UpdateApplicationStatusMutationVariables>;
export const DeleteApplicationDocument = new TypedDocumentString(`
    mutation DeleteApplication($id: ID!) {
  deleteApplication(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteApplicationMutation, DeleteApplicationMutationVariables>;
export const LoginDocument = new TypedDocumentString(`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
    `) as unknown as TypedDocumentString<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = new TypedDocumentString(`
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}
    `) as unknown as TypedDocumentString<RegisterMutation, RegisterMutationVariables>;
export const RefreshTokenDocument = new TypedDocumentString(`
    mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
    refreshToken
  }
}
    `) as unknown as TypedDocumentString<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const MeDocument = new TypedDocumentString(`
    query Me {
  me {
    id
    email
  }
}
    `) as unknown as TypedDocumentString<MeQuery, MeQueryVariables>;
export const CompaniesDocument = new TypedDocumentString(`
    query Companies {
  companies {
    id
    name
    website
  }
}
    `) as unknown as TypedDocumentString<CompaniesQuery, CompaniesQueryVariables>;
export const UpdateCompanyDocument = new TypedDocumentString(`
    mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
  updateCompany(id: $id, input: $input) {
    id
    name
    website
  }
}
    `) as unknown as TypedDocumentString<UpdateCompanyMutation, UpdateCompanyMutationVariables>;
export const DeleteCompanyDocument = new TypedDocumentString(`
    mutation DeleteCompany($id: ID!) {
  deleteCompany(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteCompanyMutation, DeleteCompanyMutationVariables>;
export const AddNoteDocument = new TypedDocumentString(`
    mutation AddNote($input: AddNoteInput!) {
  addNote(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<AddNoteMutation, AddNoteMutationVariables>;
export const UpdateNoteDocument = new TypedDocumentString(`
    mutation UpdateNote($input: UpdateNoteInput!) {
  updateNote(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<UpdateNoteMutation, UpdateNoteMutationVariables>;
export const DeleteNoteDocument = new TypedDocumentString(`
    mutation DeleteNote($id: ID!) {
  deleteNote(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteNoteMutation, DeleteNoteMutationVariables>;