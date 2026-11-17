import { graphql } from "@/gql";
import type { ApplicationsQueryVariables } from "@/gql/graphql";

graphql(`
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
`);

export const ApplicationsQuery = graphql(`
  query Applications(
    $status: ApplicationStatus
    $search: String
    $take: Int
    $skip: Int
  ) {
    applications(status: $status, search: $search, take: $take, skip: $skip) {
      total
      take
      skip
      items {
        ...ApplicationFields
      }
    }
  }
`);

export const ApplicationQuery = graphql(`
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
`);

export const DashboardQuery = graphql(`
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
`);

export const CreateApplicationMutation = graphql(`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
    }
  }
`);

export const UpdateApplicationMutation = graphql(`
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      ...ApplicationFields
    }
  }
`);

export const UpdateApplicationStatusMutation = graphql(`
  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {
    updateApplicationStatus(id: $id, status: $status) {
      ...ApplicationFields
    }
  }
`);

export const DeleteApplicationMutation = graphql(`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id)
  }
`);

// Query keys shared by server prefetching and client hooks
export const applicationKeys = {
  all: ["applications"] as const,
  list: (variables: ApplicationsQueryVariables) =>
    ["applications", "list", variables] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

// The kanban board loads up to the API page limit in one request
export const BOARD_VARIABLES: ApplicationsQueryVariables = { take: 100 };
export const LIST_PAGE_SIZE = 20;
