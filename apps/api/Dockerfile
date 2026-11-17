# syntax=docker/dockerfile:1

# ---- base: Node + OpenSSL (required by the Prisma engines on Alpine) ----
FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---- build: all dependencies, generate the Prisma client, compile TypeScript ----
FROM base AS build
COPY package.json package-lock.json ./
# The postinstall script runs `prisma generate`, which needs the schema
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

# ---- migrate: Prisma CLI + migrations, run as a one-off job before the API starts ----
FROM build AS migrate
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- prod-deps: runtime dependencies only, without the Prisma CLI (a dev dependency) ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
# - optional is omitted too: the Prisma CLI is an optional peer of @prisma/client, so npm marks
#   it "devOptional" and keeps it with --omit=dev alone
# - scripts are skipped: postinstall needs the Prisma CLI, and the generated client is copied
#   from the build stage instead. argon2 ships prebuilt binaries, so it needs no install step.
RUN npm ci --omit=dev --omit=optional --ignore-scripts && npm cache clean --force
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# ---- runtime (default target) ----
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=4000
# Files stay owned by root, so the app user can't modify them
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1
CMD ["node", "dist/main.js"]
