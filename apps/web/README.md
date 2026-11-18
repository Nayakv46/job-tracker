# Job Tracker Web

Next.js frontend for Job Tracker: dashboard, kanban board, application list and details, built on the GraphQL API in [`apps/api`](../api).

## Requirements

- Node.js 24 (LTS)
- The API running locally (see [apps/api/README.md](../api/README.md)), default `http://localhost:4000/graphql`

## Getting started

```bash
cd apps/web
npm install
cp .example.env .env.local
npm run dev
```

Open http://localhost:3000 and log in with the demo account from the API seed (`demo@jobtracker.dev` / `demo12345`) or sign up.

## Scripts

| Script              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                      |
| `npm run build`     | Production build                                          |
| `npm run start`     | Run the production build                                  |
| `npm run lint`      | ESLint                                                    |
| `npm run typecheck` | Generate route types and run TypeScript                   |
| `npm run codegen`   | Regenerate GraphQL types from `../api/src/schema.gql`     |
| `npm run test:e2e`  | Playwright browser tests against a running stack          |
| `npm run test:e2e:ui` | The same in Playwright's UI mode (watch, time travel)   |

## Environment variables

| Variable          | Default                         | Description                                           |
| ----------------- | ------------------------------- | ----------------------------------------------------- |
| `API_GRAPHQL_URL` | `http://localhost:4000/graphql` | API endpoint, used only by the Next.js server         |

## Pages

| Route                | Rendering                                   | Description                                         |
| -------------------- | ------------------------------------------- | --------------------------------------------------- |
| `/`                  | Server Component                            | Stats, applications-by-status chart, recent updates |
| `/board`             | Server prefetch + client (React Query)      | Kanban board with drag and drop                     |
| `/applications`      | Server prefetch + client                    | Search, status filter, pagination (state in URL)    |
| `/applications/new`  | Client form                                 | Create an application (`?status=` preselects)       |
| `/applications/[id]` | Server prefetch + client                    | Details, status, edit, delete, notes                |
| `/companies`         | Server prefetch + client                    | Rename, set website, delete unused companies        |
| `/login`, `/signup`  | Static                                      | Authentication                                      |

## Architecture

```
Browser ──► Next.js ──────────────────────────► NestJS API (GraphQL)
            ├─ proxy.ts           refreshes tokens, redirects to /login
            ├─ /api/auth/*        login/signup/logout, sets httpOnly cookies
            ├─ /api/graphql       forwards browser queries, adds the token
            └─ Server Components  fetch directly with the token from the cookie
```

### Authentication (backend-for-frontend)

- The API returns an access token (15 min) and a refresh token (7 days). The `/api/auth/*` route handlers store both in **httpOnly cookies**, so JavaScript in the browser can never read them.
- **`proxy.ts`** runs before every request. When the access token is missing or about to expire, it calls the API's `refreshToken` mutation, passes the new token to the page being rendered and sets the new cookies. Without a valid session it redirects to `/login?next=…`.
- Browser GraphQL requests go to **`/api/graphql`**, which attaches the token and forwards them to the API. Operations that return tokens (`login`, `register`, `refreshToken`) are rejected there, so tokens only ever travel through the cookie routes.
- The client IP is forwarded as `X-Forwarded-For` so the API's per-IP rate limiting sees real users. Locally there is no proxy in front of Next.js, so all local users share one rate-limit bucket.

### Data fetching

- **GraphQL Code Generator** (client preset) generates types for every operation in `services/` from the API's schema file, giving end-to-end typing from the database to the component. Run `npm run codegen` after changing the API schema or an operation.
- **Rendering:** with Cache Components, pages prerender a static shell (header, titles) and stream the user's data behind `<Suspense>`. Data views fetch on the server and pass the result to **React Query** through `<HydrationBoundary>`, so the first paint has data and the browser keeps managing it afterwards.
- **Mutations** invalidate the affected queries. Status changes on the board are **optimistic** and roll back if the request fails.

### Accessibility

- Kanban cards can be moved with a mouse, touch, or keyboard (drag handle, with screen reader announcements), or with the status menu on each card.
- Form labels are bound to their inputs, invalid fields set `aria-invalid`, and error messages are exposed to screen readers.

## End-to-end tests

Playwright tests in [`e2e/`](e2e) drive a real browser against the whole stack: sign up and log in, creating, editing and deleting applications, notes, kanban drag and drop, search and filters, the dashboard, companies and the mobile layout.

- Every test signs up its own user through `/api/auth/signup` and creates its data through `/api/graphql` ([fixtures.ts](e2e/fixtures.ts)), so tests are independent and run in parallel. Test users use the `@e2e.test` email domain.
- A test fails if the browser logs an uncaught exception or a console error, such as a hydration mismatch. Failed HTTP responses are ignored, because some tests trigger them on purpose (wrong password, 404 page).
- CI runs them against `docker compose up --build` (production builds) on every change to `apps/api` or `apps/web`. On failure it uploads the HTML report and traces as a `playwright-report` artifact.

Run them against the Docker stack, with the rate limits raised (all requests reach the API from the web container's IP, so parallel tests share one bucket):

```bash
# repository root
THROTTLE_LIMIT=100000 THROTTLE_AUTH_LIMIT=100000 docker compose up -d --build
# apps/web
npx playwright install chromium   # once
npm run test:e2e
npx playwright show-report        # after a failure: screenshots and traces
```

In PowerShell, set the variables first: `$env:THROTTLE_LIMIT=100000; $env:THROTTLE_AUTH_LIMIT=100000; docker compose up -d --build`. They stay set for that terminal session; `Remove-Item Env:THROTTLE_LIMIT, Env:THROTTLE_AUTH_LIMIT` restores the defaults.

To test a dev server or another port, set `E2E_BASE_URL` (default `http://localhost:3000`). Against `npm run dev`, raise `THROTTLE_LIMIT` and `THROTTLE_AUTH_LIMIT` in `apps/api/.env` instead.

## Docker

`next.config.ts` sets `output: "standalone"`, so the build emits a self-contained server in `.next/standalone`. The [Dockerfile](Dockerfile) copies only that and `.next/static` into the runtime image, which runs `node server.js` as the non-root `node` user. `API_GRAPHQL_URL` is read at runtime, so the same image works in any environment. From the repository root: `docker compose up --build web`.

## Project structure

```
app/
├── (auth)/              # login, signup (public)
├── (app)/               # authenticated pages with the navbar
└── api/                 # auth route handlers and the GraphQL forwarder
components/              # app components + ui/ (shadcn and form wrappers)
gql/                     # generated by GraphQL Code Generator (do not edit)
hooks/                   # React Query hooks per resource
lib/                     # GraphQL clients, auth cookies, formatting, schemas
services/                # GraphQL operations and query keys
proxy.ts                 # token refresh and route protection
```
