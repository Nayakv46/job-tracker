// Requires the database from docker-compose.yml (`docker compose up -d`) with migrations applied.
// Environment variables are loaded from .env by ConfigModule.
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const EMAIL_DOMAIN = '@e2e.test';

/**
 * Boots the full app. Throttler limits are read from the environment when the module
 * initialises, so each suite sets the limits it needs before calling this.
 */
async function createApp(authLimit: number) {
  process.env.THROTTLE_AUTH_LIMIT = String(authLimit);

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  await app.init();
  return app;
}

function client(getApp: () => INestApplication<App>) {
  let counter = 0;

  const gql = (query: string, variables?: object, token?: string) => {
    const req = request(getApp().getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send({ query, variables });
  };

  const register = async (name: string) => {
    const res = await gql(
      `mutation ($input: RegisterInput!) {
        register(input: $input) { accessToken refreshToken user { id email } }
      }`,
      {
        input: {
          email: `${name}-${Date.now()}-${counter++}${EMAIL_DOMAIN}`,
          password: 'password123',
        },
      },
    );
    return res.body.data.register as {
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    };
  };

  return { gql, register };
}

const CREATE_APPLICATION = `
  mutation ($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id position status appliedAt salaryMin salaryMax
      company { id name }
      notes { id }
    }
  }`;

const originalAuthLimit = process.env.THROTTLE_AUTH_LIMIT;

afterAll(async () => {
  process.env.THROTTLE_AUTH_LIMIT = originalAuthLimit;
});

describe('Job Tracker API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const { gql, register } = client(() => app);

  beforeAll(async () => {
    // High auth limit: this suite registers many users from the same IP
    app = await createApp(1000);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { endsWith: EMAIL_DOMAIN } },
    });
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  describe('auth', () => {
    it('registers, logs in and returns the current user', async () => {
      const { user } = await register('auth');

      const login = await gql(
        `mutation ($input: LoginInput!) { login(input: $input) { accessToken } }`,
        { input: { email: user.email.toUpperCase(), password: 'password123' } },
      );
      const token = login.body.data.login.accessToken;

      const me = await gql(`{ me { id email } }`, undefined, token);
      expect(me.body.data.me).toEqual(user);
    });

    it('rejects a duplicate email', async () => {
      const { user } = await register('dup');

      const res = await gql(
        `mutation ($input: RegisterInput!) { register(input: $input) { accessToken } }`,
        { input: { email: user.email, password: 'password123' } },
      );

      expect(res.body.errors[0]).toMatchObject({
        message: 'User already exists',
        extensions: { code: 'CONFLICT' },
      });
    });

    it('rejects invalid input', async () => {
      const res = await gql(
        `mutation ($input: RegisterInput!) { register(input: $input) { accessToken } }`,
        { input: { email: 'not-an-email', password: 'short' } },
      );

      expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    });

    it('rejects a wrong password', async () => {
      const { user } = await register('wrongpw');

      const res = await gql(
        `mutation ($input: LoginInput!) { login(input: $input) { accessToken } }`,
        { input: { email: user.email, password: 'wrong-password' } },
      );

      expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('refreshes tokens', async () => {
      const { refreshToken, user } = await register('refresh');

      const res = await gql(
        `mutation ($t: String!) { refreshToken(refreshToken: $t) { accessToken user { id } } }`,
        { t: refreshToken },
      );

      expect(res.body.data.refreshToken.user.id).toBe(user.id);
    });

    it('blocks protected queries without a token', async () => {
      const res = await gql(`{ applications { total } }`);

      expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('applications', () => {
    it('supports the full application lifecycle', async () => {
      const { accessToken: token } = await register('lifecycle');

      // Create
      const created = await gql(
        CREATE_APPLICATION,
        {
          input: {
            companyName: 'Acme',
            position: 'Frontend Developer',
            salaryMin: 10000,
            salaryMax: 15000,
          },
        },
        token,
      );
      const application = created.body.data.createApplication;
      expect(application).toMatchObject({
        position: 'Frontend Developer',
        status: 'WISHLIST',
        appliedAt: null,
        company: { name: 'Acme' },
        notes: [],
      });

      // A second application for the same company reuses it
      const second = await gql(
        CREATE_APPLICATION,
        {
          input: {
            companyName: 'Acme',
            position: 'Backend Developer',
            status: 'APPLIED',
          },
        },
        token,
      );
      expect(second.body.data.createApplication.company.id).toBe(
        application.company.id,
      );

      // Change status
      const moved = await gql(
        `mutation ($id: ID!) { updateApplicationStatus(id: $id, status: INTERVIEW) { status appliedAt } }`,
        { id: application.id },
        token,
      );
      expect(moved.body.data.updateApplicationStatus.status).toBe('INTERVIEW');
      expect(moved.body.data.updateApplicationStatus.appliedAt).not.toBeNull();

      // Add and edit a note
      const note = await gql(
        `mutation ($input: AddNoteInput!) { addNote(input: $input) { id content } }`,
        {
          input: {
            applicationId: application.id,
            content: 'First call went well',
          },
        },
        token,
      );
      const noteId = note.body.data.addNote.id;

      const editedNote = await gql(
        `mutation ($input: UpdateNoteInput!) { updateNote(input: $input) { id content } }`,
        { input: { id: noteId, content: 'Second round on Friday' } },
        token,
      );
      expect(editedNote.body.data.updateNote).toEqual({
        id: noteId,
        content: 'Second round on Friday',
      });

      // Filter, search, paginate and read relations
      const list = await gql(
        `{
          interview: applications(status: INTERVIEW) { total items { id notes { content } } }
          search: applications(search: "backend") { total items { position } }
          firstPage: applications(take: 1) { total take skip items { id } }
          companies { name }
          stats { status count }
        }`,
        undefined,
        token,
      );
      expect(list.body.data.interview).toEqual({
        total: 1,
        items: [
          {
            id: application.id,
            notes: [{ content: 'Second round on Friday' }],
          },
        ],
      });
      expect(list.body.data.search).toEqual({
        total: 1,
        items: [{ position: 'Backend Developer' }],
      });
      expect(list.body.data.firstPage).toMatchObject({
        total: 2,
        take: 1,
        skip: 0,
      });
      expect(list.body.data.firstPage.items).toHaveLength(1);
      expect(list.body.data.companies).toEqual([{ name: 'Acme' }]);
      expect(list.body.data.stats).toEqual(
        expect.arrayContaining([
          { status: 'APPLIED', count: 1 },
          { status: 'INTERVIEW', count: 1 },
          { status: 'WISHLIST', count: 0 },
        ]),
      );

      // Delete
      const deleted = await gql(
        `mutation ($id: ID!) { deleteApplication(id: $id) }`,
        { id: application.id },
        token,
      );
      expect(deleted.body.data.deleteApplication).toBe(true);
    });

    it("doesn't expose applications of other users", async () => {
      const owner = await register('owner');
      const intruder = await register('intruder');

      const created = await gql(
        CREATE_APPLICATION,
        { input: { companyName: 'Secret Corp', position: 'CTO' } },
        owner.accessToken,
      );
      const { id, company } = created.body.data.createApplication;

      const read = await gql(
        `query ($id: ID!) { application(id: $id) { id } }`,
        { id },
        intruder.accessToken,
      );
      expect(read.body.errors[0].extensions.code).toBe('NOT_FOUND');

      const list = await gql(
        `{ applications { total items { id } } }`,
        undefined,
        intruder.accessToken,
      );
      expect(list.body.data.applications).toEqual({ total: 0, items: [] });

      const del = await gql(
        `mutation ($id: ID!) { deleteApplication(id: $id) }`,
        { id },
        intruder.accessToken,
      );
      expect(del.body.errors[0].extensions.code).toBe('NOT_FOUND');

      const rename = await gql(
        `mutation ($id: ID!) { updateCompany(id: $id, input: { name: "Hacked" }) { id } }`,
        { id: company.id },
        intruder.accessToken,
      );
      expect(rename.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('companies', () => {
    it('renames, rejects duplicates and only deletes unused companies', async () => {
      const { accessToken: token } = await register('companies');

      const acme = await gql(
        CREATE_APPLICATION,
        { input: { companyName: 'Acme', position: 'Dev' } },
        token,
      );
      const globex = await gql(
        CREATE_APPLICATION,
        { input: { companyName: 'Globex', position: 'Dev' } },
        token,
      );
      const acmeId = acme.body.data.createApplication.company.id;
      const globexApplicationId = globex.body.data.createApplication.id;
      const globexId = globex.body.data.createApplication.company.id;

      const renamed = await gql(
        `mutation ($id: ID!) {
          updateCompany(id: $id, input: { name: "Acme Corp", website: "https://acme.example" }) {
            name website
          }
        }`,
        { id: acmeId },
        token,
      );
      expect(renamed.body.data.updateCompany).toEqual({
        name: 'Acme Corp',
        website: 'https://acme.example',
      });

      const duplicate = await gql(
        `mutation ($id: ID!) { updateCompany(id: $id, input: { name: "Globex" }) { id } }`,
        { id: acmeId },
        token,
      );
      expect(duplicate.body.errors[0].extensions.code).toBe('CONFLICT');

      const deleteCompany = (id: string) =>
        gql(`mutation ($id: ID!) { deleteCompany(id: $id) }`, { id }, token);

      // Still has an application
      const blocked = await deleteCompany(globexId);
      expect(blocked.body.errors[0].extensions.code).toBe('CONFLICT');

      await gql(
        `mutation ($id: ID!) { deleteApplication(id: $id) }`,
        { id: globexApplicationId },
        token,
      );
      const removed = await deleteCompany(globexId);
      expect(removed.body.data.deleteCompany).toBe(true);
    });
  });
});

describe('Rate limiting (e2e)', () => {
  const AUTH_LIMIT = 3;
  let app: INestApplication<App>;
  const { gql } = client(() => app);

  beforeAll(async () => {
    app = await createApp(AUTH_LIMIT);
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits auth mutations per IP but not other operations', async () => {
    const login = () =>
      gql(
        `mutation { login(input: { email: "nobody${EMAIL_DOMAIN}", password: "x" }) { accessToken } }`,
      );

    for (let i = 0; i < AUTH_LIMIT; i++) {
      const res = await login();
      expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    }

    const blocked = await login();
    expect(blocked.body.errors[0].extensions.code).toBe('TOO_MANY_REQUESTS');

    // The stricter auth limit doesn't apply to the rest of the API
    const other = await gql(`{ companies { id } }`);
    expect(other.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');

    await request(app.getHttpServer()).get('/health').expect(200);
  });
});
