/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment ApplicationFields on Application {\n    id\n    position\n    url\n    salaryMin\n    salaryMax\n    status\n    appliedAt\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      website\n    }\n  }\n": typeof types.ApplicationFieldsFragmentDoc,
    "\n  query Applications(\n    $status: ApplicationStatus\n    $search: String\n    $take: Int\n    $skip: Int\n  ) {\n    applications(status: $status, search: $search, take: $take, skip: $skip) {\n      total\n      take\n      skip\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n": typeof types.ApplicationsDocument,
    "\n  query Application($id: ID!) {\n    application(id: $id) {\n      ...ApplicationFields\n      notes {\n        id\n        content\n        createdAt\n      }\n    }\n  }\n": typeof types.ApplicationDocument,
    "\n  query Dashboard {\n    stats {\n      status\n      count\n    }\n    recent: applications(take: 5) {\n      total\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n": typeof types.DashboardDocument,
    "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateApplicationDocument,
    "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      ...ApplicationFields\n    }\n  }\n": typeof types.UpdateApplicationDocument,
    "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      ...ApplicationFields\n    }\n  }\n": typeof types.UpdateApplicationStatusDocument,
    "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id)\n  }\n": typeof types.DeleteApplicationDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n": typeof types.RegisterDocument,
    "\n  mutation RefreshToken($refreshToken: String!) {\n    refreshToken(refreshToken: $refreshToken) {\n      accessToken\n      refreshToken\n    }\n  }\n": typeof types.RefreshTokenDocument,
    "\n  query Me {\n    me {\n      id\n      email\n    }\n  }\n": typeof types.MeDocument,
    "\n  query Companies {\n    companies {\n      id\n      name\n      website\n    }\n  }\n": typeof types.CompaniesDocument,
    "\n  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {\n    updateCompany(id: $id, input: $input) {\n      id\n      name\n      website\n    }\n  }\n": typeof types.UpdateCompanyDocument,
    "\n  mutation DeleteCompany($id: ID!) {\n    deleteCompany(id: $id)\n  }\n": typeof types.DeleteCompanyDocument,
    "\n  mutation AddNote($input: AddNoteInput!) {\n    addNote(input: $input) {\n      id\n    }\n  }\n": typeof types.AddNoteDocument,
    "\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateNoteDocument,
    "\n  mutation DeleteNote($id: ID!) {\n    deleteNote(id: $id)\n  }\n": typeof types.DeleteNoteDocument,
};
const documents: Documents = {
    "\n  fragment ApplicationFields on Application {\n    id\n    position\n    url\n    salaryMin\n    salaryMax\n    status\n    appliedAt\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      website\n    }\n  }\n": types.ApplicationFieldsFragmentDoc,
    "\n  query Applications(\n    $status: ApplicationStatus\n    $search: String\n    $take: Int\n    $skip: Int\n  ) {\n    applications(status: $status, search: $search, take: $take, skip: $skip) {\n      total\n      take\n      skip\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n": types.ApplicationsDocument,
    "\n  query Application($id: ID!) {\n    application(id: $id) {\n      ...ApplicationFields\n      notes {\n        id\n        content\n        createdAt\n      }\n    }\n  }\n": types.ApplicationDocument,
    "\n  query Dashboard {\n    stats {\n      status\n      count\n    }\n    recent: applications(take: 5) {\n      total\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n": types.DashboardDocument,
    "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n    }\n  }\n": types.CreateApplicationDocument,
    "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      ...ApplicationFields\n    }\n  }\n": types.UpdateApplicationDocument,
    "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      ...ApplicationFields\n    }\n  }\n": types.UpdateApplicationStatusDocument,
    "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id)\n  }\n": types.DeleteApplicationDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation RefreshToken($refreshToken: String!) {\n    refreshToken(refreshToken: $refreshToken) {\n      accessToken\n      refreshToken\n    }\n  }\n": types.RefreshTokenDocument,
    "\n  query Me {\n    me {\n      id\n      email\n    }\n  }\n": types.MeDocument,
    "\n  query Companies {\n    companies {\n      id\n      name\n      website\n    }\n  }\n": types.CompaniesDocument,
    "\n  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {\n    updateCompany(id: $id, input: $input) {\n      id\n      name\n      website\n    }\n  }\n": types.UpdateCompanyDocument,
    "\n  mutation DeleteCompany($id: ID!) {\n    deleteCompany(id: $id)\n  }\n": types.DeleteCompanyDocument,
    "\n  mutation AddNote($input: AddNoteInput!) {\n    addNote(input: $input) {\n      id\n    }\n  }\n": types.AddNoteDocument,
    "\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n    }\n  }\n": types.UpdateNoteDocument,
    "\n  mutation DeleteNote($id: ID!) {\n    deleteNote(id: $id)\n  }\n": types.DeleteNoteDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ApplicationFields on Application {\n    id\n    position\n    url\n    salaryMin\n    salaryMax\n    status\n    appliedAt\n    createdAt\n    updatedAt\n    company {\n      id\n      name\n      website\n    }\n  }\n"): typeof import('./graphql').ApplicationFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Applications(\n    $status: ApplicationStatus\n    $search: String\n    $take: Int\n    $skip: Int\n  ) {\n    applications(status: $status, search: $search, take: $take, skip: $skip) {\n      total\n      take\n      skip\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n"): typeof import('./graphql').ApplicationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Application($id: ID!) {\n    application(id: $id) {\n      ...ApplicationFields\n      notes {\n        id\n        content\n        createdAt\n      }\n    }\n  }\n"): typeof import('./graphql').ApplicationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Dashboard {\n    stats {\n      status\n      count\n    }\n    recent: applications(take: 5) {\n      total\n      items {\n        ...ApplicationFields\n      }\n    }\n  }\n"): typeof import('./graphql').DashboardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').CreateApplicationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      ...ApplicationFields\n    }\n  }\n"): typeof import('./graphql').UpdateApplicationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      ...ApplicationFields\n    }\n  }\n"): typeof import('./graphql').UpdateApplicationStatusDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id)\n  }\n"): typeof import('./graphql').DeleteApplicationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n"): typeof import('./graphql').LoginDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n      }\n    }\n  }\n"): typeof import('./graphql').RegisterDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RefreshToken($refreshToken: String!) {\n    refreshToken(refreshToken: $refreshToken) {\n      accessToken\n      refreshToken\n    }\n  }\n"): typeof import('./graphql').RefreshTokenDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      email\n    }\n  }\n"): typeof import('./graphql').MeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Companies {\n    companies {\n      id\n      name\n      website\n    }\n  }\n"): typeof import('./graphql').CompaniesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {\n    updateCompany(id: $id, input: $input) {\n      id\n      name\n      website\n    }\n  }\n"): typeof import('./graphql').UpdateCompanyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCompany($id: ID!) {\n    deleteCompany(id: $id)\n  }\n"): typeof import('./graphql').DeleteCompanyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddNote($input: AddNoteInput!) {\n    addNote(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').AddNoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateNote($input: UpdateNoteInput!) {\n    updateNote(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').UpdateNoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNote($id: ID!) {\n    deleteNote(id: $id)\n  }\n"): typeof import('./graphql').DeleteNoteDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
