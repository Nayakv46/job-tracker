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
   ├── /         → Next.js (Deployment, SSR)
   └── /graphql  → NestJS API (Deployment)
                      │
                      ▼
              PostgreSQL (Amazon RDS)
```

### Components

- **Frontend:** Next.js (App Router), React, TypeScript, Apollo Client, Tailwind CSS
- **Backend:** NestJS (code-first) with GraphQL (Apollo Driver), Prisma ORM
- **Database:** PostgreSQL (Docker locally, Amazon RDS in AWS)
- **Infrastructure (Terraform):** VPC, EKS, RDS, ECR, IAM, S3, Route 53 (optional)
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
│   │   ├── modules/        # vpc, eks, rds, ecr
│   │   └── envs/dev/       # main.tf, variables.tf, backend.tf
│   └── k8s/                # manifests or Helm chart
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
npm i @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm i prisma @prisma/client
```

### Implementation

- PostgreSQL runs locally via `docker-compose.yml` (`postgres:16` image, volume, port 5432).
- Prisma schema defines `User`, `Company`, `Application`, `Note` (see [Data Model](#12-data-model)); migrations via `npx prisma migrate dev`.
- `GraphQLModule` configured with `autoSchemaFile` (code-first); `ApplicationsModule` with resolver and service.
- Auth module: registration, login, `JwtAuthGuard`, `@CurrentUser()` decorator. All application queries are scoped by `userId`.
- Input validation with `class-validator`; pagination and filters (status, search phrase).
- Unit tests for services; e2e tests for GraphQL (supertest).
- `/health` endpoint for Kubernetes probes.

## 7. Frontend (Next.js + React + TypeScript)

### Setup

```bash
npx create-next-app@latest web --typescript --tailwind --app
npm i @apollo/client graphql
npx graphql-codegen init
```

### Implementation

- Pages: login/registration, application list, kanban board, application details, statistics dashboard.
- GraphQL Code Generator produces types for queries and mutations from the API schema, giving end-to-end typing from database to component.
- Auth token stored in an httpOnly cookie (not localStorage).
- Rendering: SSR for data views, client components for interactive parts.
- Error and loading states, responsive layout, accessibility (a11y).

## 8. Containers

- Multi-stage Dockerfiles for `api` and `web` (build stage → lightweight runtime image, non-root user).
- Next.js configured with `output: 'standalone'`.
- Full stack runnable with `docker compose up`.

## 9. Kubernetes

Local deployment (kind/minikube) and EKS use the same manifests/chart:

- Deployment and Service for `api` and `web`
- Ingress (NGINX locally, AWS Load Balancer Controller on EKS)
- ConfigMap for configuration; Secret for `DATABASE_URL` and `JWT_SECRET`
- `readinessProbe` and `livenessProbe` on `/health`
- `resources.requests/limits` and HorizontalPodAutoscaler
- Database migrations as a Job or initContainer

Packaging: plain manifests with Kustomize, or a Helm chart.

## 10. AWS Infrastructure (Terraform)

### State

Remote state in an S3 bucket with locking (DynamoDB or native S3 locking, depending on Terraform version).

### Modules

- **vpc** – public and private subnets, NAT
- **eks** – cluster and managed node group (e.g. `terraform-aws-modules/eks/aws`)
- **rds** – PostgreSQL in a private subnet; security group allows access only from EKS nodes
- **ecr** – two repositories: `api` and `web`
- **iam** – GitHub Actions role via OIDC; IRSA for controllers

### Additional

- RDS password stored in AWS Secrets Manager.
- Terraform Helm provider installs AWS Load Balancer Controller (optionally ExternalDNS and cert-manager).

### Commands

```bash
terraform init
terraform plan -out=tfplan
terraform apply tfplan
aws eks update-kubeconfig --name job-tracker-dev --region eu-central-1
```

### Deployment to EKS

- Images built and pushed to ECR.
- Manifests/chart applied with `kubectl apply -k` or `helm upgrade --install`.
- Ingress with AWS Load Balancer Controller provisions an ALB; domain via Route 53 and certificate from ACM for HTTPS.

## 11. CI/CD (GitHub Actions)

- **CI** (every pull request): lint, tests, build, `terraform fmt -check`, `terraform validate`.
- **CD** (merge to `main`): build images → push to ECR (OIDC authentication, no stored keys) → deploy to EKS.
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
- Password hashing with bcrypt
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
- E2E tests with Playwright
- Karpenter instead of cluster-autoscaler
