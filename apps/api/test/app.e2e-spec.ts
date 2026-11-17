// Requires the database from docker-compose.yml (`docker compose up -d`) with migrations applied.
// Environment variables are loaded from .env by ConfigModule.
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const EMAIL_DOMAIN = '@e2e.test';

describe('Job Tracker API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const gql = (query: string, variables?: object, token?: string) => {
    const req = request(app.getHttpServer()).post('/graphql');
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
          email: `${name}-${Date.now()}${EMAIL_DOMAIN}`,
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

  const CREATE_APPLICATION = `
    mutation ($input: CreateApplicationInput!) {
      createApplication(input: $input) {
        id position status appliedAt salaryMin salaryMax
        company { id name }
        notes { id }
      }
    }`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
      const res = await gql(`{ applications { id } }`);

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

      // Add a note
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
      expect(note.body.data.addNote.content).toBe('First call went well');

      // Filter, search and read relations
      const list = await gql(
        `{
          interview: applications(status: INTERVIEW) { id notes { content } }
          search: applications(search: "backend") { position }
          companies { name }
          stats { status count }
        }`,
        undefined,
        token,
      );
      expect(list.body.data.interview).toEqual([
        { id: application.id, notes: [{ content: 'First call went well' }] },
      ]);
      expect(list.body.data.search).toEqual([
        { position: 'Backend Developer' },
      ]);
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
      const id = created.body.data.createApplication.id;

      const read = await gql(
        `query ($id: ID!) { application(id: $id) { id } }`,
        { id },
        intruder.accessToken,
      );
      expect(read.body.errors[0].extensions.code).toBe('NOT_FOUND');

      const list = await gql(
        `{ applications { id } }`,
        undefined,
        intruder.accessToken,
      );
      expect(list.body.data.applications).toEqual([]);

      const del = await gql(
        `mutation ($id: ID!) { deleteApplication(id: $id) }`,
        { id },
        intruder.accessToken,
      );
      expect(del.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
  });
});
