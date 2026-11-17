import type { CodegenConfig } from "@graphql-codegen/cli";

// Generates TypeScript types for every GraphQL operation in `services/`
// from the schema produced by the NestJS API (code-first).
const config: CodegenConfig = {
  schema: "../api/src/schema.gql",
  documents: ["services/**/*.ts"],
  ignoreNoDocuments: true,
  generates: {
    "./gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        // Plain query strings instead of AST objects: no `graphql` runtime needed in the bundle
        documentMode: "string",
        enumsAsTypes: true,
        useTypeImports: true,
        scalars: { DateTime: "string" },
      },
    },
  },
};

export default config;
