# Job Tracker – Technical Overview

A full-stack application for tracking job applications, built with Next.js, React, TypeScript, Node.js, NestJS, GraphQL, PostgreSQL, AWS, Terraform and Kubernetes.

## 1. Purpose

Job Tracker lets a user record job offers, companies and recruitment stages, and view the progress of each application on a kanban board. The domain requires relational data, authentication, filtering and a statistics dashboard.

## 2. MVP Scope

- Registration and login (JWT)
- Job application CRUD: company, position, offer URL, salary range, status, notes, date
- Statuses: `WISHLIST`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`
- Kanban board in Next.js with status changes (drag and drop or button)
- Filtering and search; basic statistics (number of applications per status)
- Optional: attachments (CV / cover letter) stored in S3

Out of scope: payments, push notifications, complex role systems, microservices.

## 3. Architecture

```
Browser
   │
   ▼
Ingress (AWS Load Balancer Controller, HTTPS)
   │
   └── /  → Next.js (Deployment, SSR + /api/graphql proxy)
                │  cluster-internal Service
                ▼
            NestJS API (Deployment)
                │
                ▼
            PostgreSQL (Amazon RDS)
```

Only the web app is exposed. It holds the tokens in httpOnly cookies and calls the API server-side, so the API has no public route.

### Components

- **Frontend:** Next.js (App Router), React, TypeScript, TanStack Query, Tailwind CSS
- **Backend:** NestJS (code-first) with GraphQL (Apollo Driver), Prisma ORM
- **Database:** PostgreSQL (Docker locally, Amazon RDS in AWS)
- **Infrastructure (Terraform):** VPC, EKS, RDS, ECR, IAM, Secrets Manager, S3 (state), Route 53 (optional)
- **Kubernetes:** Deployments, Services, Ingress, ConfigMap/Secret, HPA, probes
- **CI/CD:** GitHub Actions (tests, image build, push to ECR, deploy)

## 4. Repository Structure

```
job-tracker/
├── apps/
│   ├── api/                # NestJS + GraphQL
│   └── web/                # Next.js
├── infra/
│   ├── terraform/
│   │   ├── bootstrap/      # S3 state bucket
│   │   ├── modules/        # vpc, eks, rds, ecr, github-oidc, k8s-platform
│   │   └── envs/dev/       # main.tf, variables.tf, backend.tf, tests/
│   └── k8s/                # Kustomize base + local/eks overlays
├── docker-compose.yml      # local development
├── .github/workflows/      # CI/CD
└── README.md
```

## 5. Tooling

Node.js (LTS), Docker, Git, kubectl, Terraform, AWS CLI, Helm, and kind or minikube for local Kubernetes.

## 6. Backend (NestJS + GraphQL + PostgreSQL)

### Dependencies

```bash
npm i @nestjs/graphql @nestjs/apollo @apollo/server graphql
npm i @nestjs/jwt argon2 class-validator class-transformer @nestjs/throttler graphql-depth-limit
npm i prisma @prisma/client
```

### Implementation

- PostgreSQL runs locally via `docker-compose.yml` (`postgres:16` image, volume, host port 5434 → container 5432).
- Prisma schema defines `User`, `Company`, `Application`, `Note` (see [Data Model](#12-data-model)); migrations via `npx prisma migrate dev`.
- `GraphQLModule` configured with `autoSchemaFile` (code-first); `ApplicationsModule` with resolver and service.
- Auth module: registration, login and token refresh (access + refresh JWTs via `@nestjs/jwt`), passwords hashed with argon2id, `GqlAuthGuard` and `@CurrentUser()` decorator. All application queries are scoped by `userId`.
- Input validation with `class-validator`; pagination (`{ items, total, take, skip }`) and filters (status, search phrase).
- Rate limiting with `@nestjs/throttler` (stricter limit on auth mutations) and GraphQL query depth limiting.
- Unit tests for services; e2e tests for GraphQL (Vitest + supertest).
- `/health` endpoint for Kubernetes probes.

## 7. Frontend (Next.js + React + TypeScript)

### Setup

```bash
npx create-next-app@latest web --typescript --tailwind --app
npm i @tanstack/react-query graphql
npm i -D @graphql-codegen/cli @graphql-codegen/client-preset
```

### Implementation

- Pages: login/registration, application list, kanban board, application details, statistics dashboard.
- GraphQL Code Generator (client preset) produces typed documents for queries and mutations from the API schema, giving end-to-end typing from database to component.
- Data fetching with TanStack Query (React Query) and a small `fetch`-based GraphQL client instead of Apollo Client, following the next-boilerplate convention. Mutations invalidate the affected queries; kanban status changes are optimistic.
- Auth (backend-for-frontend): Next.js route handlers store the access and refresh tokens in httpOnly cookies (not localStorage); `proxy.ts` refreshes the access token and protects routes; browser GraphQL requests go through a `/api/graphql` route that attaches the token.
- Rendering: Server Components prefetch data and hydrate React Query on the client; with Cache Components, pages prerender a static shell and stream user data behind `<Suspense>`.
- Error and loading states, responsive layout, accessibility (a11y).
- End-to-end tests with Playwright (`apps/web/e2e`) against the full Docker stack: each test signs up its own user, so tests run in parallel; a test fails on browser console errors.

## 8. Containers

- Multi-stage Dockerfiles for `api` and `web` (build stage → lightweight runtime image, non-root user).
- The API image has a separate `migrate` target (Prisma CLI + migrations) that runs `prisma migrate deploy` as a one-off job before the API starts (a compose service locally, a Kubernetes Job later).
- Next.js configured with `output: 'standalone'`.
- Full stack runnable with `docker compose up`.

## 9. Kubernetes

Kustomize manifests in `infra/k8s` (see its [README](../infra/k8s/README.md)): a shared `base` plus one overlay per environment. Local deployment uses kind; EKS gets its own overlay.

- Deployment, Service and HorizontalPodAutoscaler for `api` and `web`; `resources.requests/limits` on every container
- Ingress to the web app only (ingress-nginx locally, AWS Load Balancer Controller on EKS); the API Service is cluster-internal
- ConfigMap for configuration; Secret for `DATABASE_URL`, `JWT_SECRET` and `REFRESH_SECRET` (generated by Kustomize locally, synced from AWS Secrets Manager by the External Secrets Operator on EKS)
- API: `readinessProbe` on `/health` (checks the database), TCP `livenessProbe` so a database outage doesn't restart pods
- Database migrations in an initContainer using the API image's `migrate` target
- `restricted` Pod Security Standard: non-root, read-only root filesystem, no capabilities
- Local overlay runs PostgreSQL as a StatefulSet; on EKS the API uses RDS

## 10. AWS Infrastructure (Terraform)

Terraform code in `infra/terraform` (see its [README](../infra/terraform/README.md)): reusable modules plus one root configuration per environment (`envs/dev`).

### State

Remote state in an S3 bucket (versioned, encrypted, TLS only) created by a separate `bootstrap` configuration. Locking uses S3 native lock files (`use_lockfile`), so no DynamoDB table is needed.

### Modules

- **vpc** – public subnets (ALB, NAT), private subnets (nodes) and isolated database subnets across 2 AZs; one NAT gateway in dev (`terraform-aws-modules/vpc/aws`)
- **eks** – cluster, managed node group and add-ons (VPC CNI, CoreDNS, kube-proxy, metrics-server, Pod Identity agent) (`terraform-aws-modules/eks/aws`)
- **rds** – PostgreSQL in the database subnets, TLS enforced; security group allows access only from EKS nodes
- **ecr** – three repositories: `api`, `api-migrate` and `web` (immutable tags, scan on push)
- **github-oidc** – GitHub Actions role via OIDC: push to ECR, deploy to the app namespace only
- **k8s-platform** – AWS Load Balancer Controller and External Secrets Operator (Helm, with EKS Pod Identity), app namespace and deploy RBAC

### Secrets

The database password and JWT secrets are generated as ephemeral values and written with write-only arguments, so they never appear in the Terraform plan or state. They're stored in AWS Secrets Manager and synced into the cluster by the External Secrets Operator.

### Commands

```bash
terraform init -backend-config=backend.hcl
terraform plan -out=tfplan
terraform apply tfplan
aws eks update-kubeconfig --name job-tracker-dev --region eu-central-1
```

Offline checks: `terraform fmt -check`, `terraform validate`, `tflint`, and `terraform test` (plan against mocked providers).

### Deployment to EKS

- Images built and pushed to ECR, tagged with the git SHA.
- Manifests applied with `kubectl apply -k infra/k8s/overlays/eks`.
- Ingress with AWS Load Balancer Controller provisions an ALB (HTTP on its hostname; HTTPS with Route 53 and ACM needs a domain).

## 11. CI/CD (GitHub Actions)

Workflows in `.github/workflows`. Third-party actions are pinned to commit SHAs.

- **CI** (`ci.yml`, every pull request and push to `main`). Each job runs only when its files change, and a final `ci` job gives branch protection a single required check.
  - **api:** lint, build, unit tests, then migrations and e2e tests against a PostgreSQL service container; fails if `src/schema.gql` is out of date.
  - **web:** fails if the codegen output in `gql/` is out of date; lint, type check, build.
  - **docker:** builds the `api`, `api-migrate` and `web` images (no push).
  - **e2e:** starts the stack with Docker Compose and runs the Playwright tests; uploads the report and traces on failure.
  - **terraform:** `fmt -check`, `validate`, `terraform test` (mocked providers), tflint.
  - **k8s:** builds both Kustomize overlays and validates them with kubeconform (including the External Secrets CRDs).
- **CD** (`cd.yml`, after CI passes on `main`, or run manually): assumes the Terraform-managed IAM role through OIDC (no stored keys), builds and pushes the three images to ECR tagged with the commit SHA, then `kubectl apply -k infra/k8s/overlays/eks` and waits for the rollout. It only runs when the repository variable `AWS_DEPLOY_ROLE_ARN` is set, so merges don't fail while the AWS environment is torn down.
- Optional: GitOps with Argo CD instead of pipeline-based deploy.

## 12. Data Model

| Entity      | Fields                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| User        | id, email, passwordHash, createdAt                                                                         |
| Company     | id, userId, name, website                                                                                  |
| Application | id, userId, companyId, position, url, salaryMin, salaryMax, status, appliedAt, createdAt, updatedAt        |
| Note        | id, applicationId, content, createdAt                                                                      |

Relations: User 1–N Company, User 1–N Application, Company 1–N Application, Application 1–N Note.
Indexes on `userId` and `status`.

## 13. GraphQL Schema (draft)

```graphql
enum ApplicationStatus { WISHLIST APPLIED INTERVIEW OFFER REJECTED }

type Application {
  id: ID!
  position: String!
  company: Company!
  status: ApplicationStatus!
  salaryMin: Int
  salaryMax: Int
  appliedAt: DateTime
  notes: [Note!]!
}

type Query {
  applications(status: ApplicationStatus, search: String, take: Int, skip: Int): PaginatedApplications!
  application(id: ID!): Application
  stats: [StatusCount!]!
}

type Mutation {
  createApplication(input: CreateApplicationInput!): Application!
  updateApplicationStatus(id: ID!, status: ApplicationStatus!): Application!
  deleteApplication(id: ID!): Boolean!
  login(email: String!, password: String!): AuthPayload!
  register(email: String!, password: String!): AuthPayload!
}
```

N+1 handling for `company` and `notes` relations: DataLoader or Prisma `include`.

## 14. Security

- No secrets in the repository
- RDS in a private subnet
- Least-privilege IAM
- Password hashing with argon2id
- Tokens kept in httpOnly cookies on the frontend, never exposed to browser JavaScript
- Rate limiting and GraphQL query depth limiting

## 15. Cost Considerations

- EKS control plane, EC2 nodes, NAT Gateway, ALB and RDS all incur charges.
- AWS Budgets alert configured (e.g. 20 USD).
- Infrastructure is torn down with `terraform destroy` when not in use and recreated from code.
- Day-to-day development uses kind/minikube.

## 16. Possible Extensions

- Argo CD (GitOps)
- Monitoring: Prometheus + Grafana, logs to CloudWatch
- GraphQL subscriptions (live updates)
- Redis cache (ElastiCache)
- Importing offers from a URL (scraping or API integration)
- Karpenter instead of cluster-autoscaler
