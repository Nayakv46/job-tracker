STACK
Frontend
Next.js, React

Backend
Node.js, NestJS

Structure - monorepo/turborepo

Commands

For both frontend and backend to start use separately in folders /api and /web
npm install
npm run dev

To build the applications use in respective folders
npm run build

Tests

API (/apps/api): npm test (unit), npm run test:e2e (needs the database: docker compose up -d db)
Web (/apps/web): npm run test:e2e (Playwright, needs the full stack, see apps/web/README.md)
Terraform (/infra/terraform/envs/dev): terraform init -backend=false && terraform test

Conventions

Code structures are based on boilerplate projects clones into /reference folder and can be cloned from these repositories

[React Boilerplate](https://github.com/Nayakv46/react-boilerplate)
[Node.js Boilerplate](https://github.com/Nayakv46/node-boilerplate)
[Next.js Boilerplate](https://github.com/Nayakv46/next-boilerplate)
