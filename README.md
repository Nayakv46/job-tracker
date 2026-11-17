# Job Tracker

Full-stack app for tracking job applications: kanban board, filterable list, notes and a statistics dashboard. Built with Next.js, NestJS, GraphQL, Prisma and PostgreSQL, with AWS, Terraform and Kubernetes infrastructure planned.

| Folder                     | Description                                     |
| -------------------------- | ----------------------------------------------- |
| [`apps/api`](apps/api)     | NestJS GraphQL API ([README](apps/api/README.md)) |
| [`apps/web`](apps/web)     | Next.js frontend ([README](apps/web/README.md))   |
| [`docs`](docs/PROJECT.md)  | Technical overview                              |
| `infra`                    | Terraform and Kubernetes (planned)              |

## Run the full stack with Docker

```bash
docker compose up --build
```

This starts PostgreSQL, applies migrations, then starts the API (http://localhost:4000/graphql) and the web app (http://localhost:3000). To get the demo account (`demo@jobtracker.dev` / `demo12345`):

```bash
docker compose run --rm migrate npx prisma db seed
```

Optional overrides (JWT secrets, host ports) go in a root `.env` file, see [.example.env](.example.env). The defaults are for local use only.

## Development

Run the database in Docker and the apps with hot reload:

```bash
docker compose up -d db
cd apps/api && npm install && cp .example.env .env && npm run prisma:migrate && npm run dev
cd apps/web && npm install && cp .example.env .env.local && npm run dev
```

See the app READMEs for scripts, environment variables and architecture.
