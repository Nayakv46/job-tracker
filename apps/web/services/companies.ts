import { graphql } from "@/gql";

export const CompaniesQuery = graphql(`
  query Companies {
    companies {
      id
      name
      website
    }
  }
`);

export const UpdateCompanyMutation = graphql(`
  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) {
      id
      name
      website
    }
  }
`);

export const DeleteCompanyMutation = graphql(`
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id)
  }
`);

export const companyKeys = {
  all: ["companies"] as const,
};
