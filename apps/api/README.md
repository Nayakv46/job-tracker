# Job Tracker API

GraphQL API for the Job Tracker app, built with NestJS, Apollo (code-first), Prisma and PostgreSQL.

## Requirements

- Node.js 24 (LTS)
- Docker (for the local PostgreSQL database)

## Getting started

```bash
# 1. Start PostgreSQL (from the repository root)
docker compose up -d

# 2. Install dependencies (also generates the Prisma client)
cd apps/api
npm install

# 3. Create the env file
cp .example.env .env

# 4. Apply database migrations
npm run prisma:migrate

# 5. (Optional) Load demo data: demo@jobtracker.dev / demo12345
npm run seed

# 6. Start the API in watch mode
npm run dev
```

- GraphQL endpoint and Apollo Sandbox: http://localhost:4000/graphql
- Health check: http://localhost:4000/health

## Scripts

| Script                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | Start in watch mode                                      |
| `npm run build`           | Generate the Prisma client and compile to `dist/`        |
| `npm run start:prod`      | Run the compiled app (`node dist/main`)                  |
| `npm run prisma:migrate`  | Create/apply migrations in development                   |
| `npm run prisma:deploy`   | Apply pending migrations (CI, containers, Kubernetes)    |
| `npm run prisma:studio`   | Open Prisma Studio                                       |
| `npm run seed`            | Create the demo user with sample data (skips if present) |
| `npm test`                | Unit tests (Vitest)                                      |
| `npm run test:e2e`        | E2E tests against the local database                     |
| `npm run lint`            | Lint with oxlint                                         |

## Environment variables

| Variable              | Default                 | Description                                                        |
| --------------------- | ----------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`        | –                       | PostgreSQL connection string                                       |
| `JWT_SECRET`          | –                       | Secret for access tokens                                           |
| `REFRESH_SECRET`      | –                       | Secret for refresh tokens (must differ from `JWT_SECRET`)          |
| `JWT_EXPIRES_IN`      | `15m`                   | Access token lifetime                                              |
| `REFRESH_EXPIRES_IN`  | `7d`                    | Refresh token lifetime                                             |
| `PORT`                | `4000`                  | HTTP port                                                          |
| `FRONTEND_URL`        | `http://localhost:3000` | Allowed CORS origin                                                |
| `THROTTLE_LIMIT`      | `100`                   | Requests per minute per IP for the whole API                       |
| `THROTTLE_AUTH_LIMIT` | `10`                    | Requests per minute per IP for `register`/`login`/`refreshToken`   |
| `TRUST_PROXY`         | `0`                     | Reverse proxies in front of the API (set to `1` behind Ingress/ALB) |

## Project structure

```
prisma/
├── schema.prisma        # data model (User, Company, Application, Note)
├── migrations/
├── seed.ts              # entry point for `npm run seed`
└── seeds/               # individual seed scripts
src/
├── auth/                # register/login/refresh, JWT guard, @CurrentUser
├── applications/        # applications CRUD, filtering, pagination, stats
├── companies/           # company list, rename, delete
├── notes/               # notes on applications
├── health/              # GET /health (database check)
├── prisma/              # PrismaService (global)
├── throttling/          # rate limiting for HTTP and GraphQL
├── graphql-error.formatter.ts
├── schema.gql           # generated GraphQL schema (do not edit)
└── main.ts
test/                    # e2e tests
```

## API overview

**Queries:** `me`, `applications(status, search, take, skip)` returning `{ items, total, take, skip }`, `application(id)`, `companies`, `stats`

**Mutations:** `register`, `login`, `refreshToken`, `createApplication`, `updateApplication`, `updateApplicationStatus`, `deleteApplication`, `updateCompany`, `deleteCompany`, `addNote`, `updateNote`, `deleteNote`

The full schema is in [src/schema.gql](src/schema.gql). It is regenerated from the decorators on every start.

### Authentication

`register` and `login` return an `accessToken` (15 min) and a `refreshToken` (7 days). Send the access token as `Authorization: Bearer <token>`. When it expires, call `refreshToken` to get a new pair. Every query and mutation except the three auth mutations requires a token, and all data is scoped to the authenticated user.

### Errors

Errors use standard GraphQL `extensions.code` values: `BAD_REQUEST` (validation), `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` (duplicate email or company name, deleting a company that still has applications) and `TOO_MANY_REQUESTS`.

### Design notes

- **N+1:** `company` and `notes` are loaded with Prisma `include` in the same query as the applications.
- **Companies** are created implicitly: `createApplication` takes a `companyName` and reuses an existing company with that name.
- **`appliedAt`** is set automatically the first time an application leaves `WISHLIST`.
- **Security:** argon2id password hashing, per-IP rate limiting with a stricter limit on auth mutations, query depth limit of 7, input validation with `class-validator`.
