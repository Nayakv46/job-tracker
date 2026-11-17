import { ApplicationStatus, PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/auth/utils/password-hashing.js';

export const DEMO_EMAIL = 'demo@jobtracker.dev';
export const DEMO_PASSWORD = 'demo12345';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const companies = [
  { name: 'Acme Software', website: 'https://acme.example' },
  { name: 'Globex', website: 'https://globex.example' },
  { name: 'Initech', website: 'https://initech.example' },
  { name: 'Umbrella Labs', website: null },
  { name: 'Stark Digital', website: 'https://stark.example' },
];

const applications: {
  company: string;
  position: string;
  status: ApplicationStatus;
  salaryMin?: number;
  salaryMax?: number;
  appliedDaysAgo?: number;
  url?: string;
  notes?: string[];
}[] = [
  {
    company: 'Acme Software',
    position: 'Senior Frontend Developer',
    status: ApplicationStatus.INTERVIEW,
    salaryMin: 18000,
    salaryMax: 24000,
    appliedDaysAgo: 14,
    url: 'https://acme.example/careers/frontend',
    notes: [
      'Recruiter call went well, stack is Next.js + GraphQL.',
      'Technical interview scheduled for next week.',
    ],
  },
  {
    company: 'Acme Software',
    position: 'Fullstack Developer',
    status: ApplicationStatus.REJECTED,
    salaryMin: 15000,
    salaryMax: 20000,
    appliedDaysAgo: 40,
    notes: ['Position filled internally.'],
  },
  {
    company: 'Globex',
    position: 'React Developer',
    status: ApplicationStatus.APPLIED,
    salaryMin: 14000,
    salaryMax: 19000,
    appliedDaysAgo: 5,
  },
  {
    company: 'Globex',
    position: 'Node.js Backend Engineer',
    status: ApplicationStatus.WISHLIST,
    url: 'https://globex.example/jobs/node',
  },
  {
    company: 'Initech',
    position: 'Fullstack TypeScript Engineer',
    status: ApplicationStatus.OFFER,
    salaryMin: 20000,
    salaryMax: 26000,
    appliedDaysAgo: 30,
    notes: ['Offer received, decision by Friday.'],
  },
  {
    company: 'Umbrella Labs',
    position: 'Platform Engineer (Kubernetes)',
    status: ApplicationStatus.APPLIED,
    appliedDaysAgo: 3,
  },
  {
    company: 'Stark Digital',
    position: 'Frontend Engineer',
    status: ApplicationStatus.WISHLIST,
    salaryMin: 16000,
    salaryMax: 21000,
  },
  {
    company: 'Stark Digital',
    position: 'DevOps Engineer',
    status: ApplicationStatus.INTERVIEW,
    appliedDaysAgo: 10,
    notes: ['Take-home task: Terraform module for an S3 bucket.'],
  },
];

/**
 * Creates a demo user with sample companies, applications and notes.
 * Skips if the demo user already exists.
 */
export async function main() {
  const prisma = new PrismaClient();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
    });
    if (existingUser) {
      console.log(`Demo user ${DEMO_EMAIL} already exists`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: DEMO_EMAIL,
          passwordHash: await hashPassword(DEMO_PASSWORD),
        },
      });

      const companyIds = new Map<string, string>();
      for (const company of companies) {
        const created = await tx.company.create({
          data: { ...company, userId: user.id },
        });
        companyIds.set(company.name, created.id);
      }

      for (const {
        company,
        notes = [],
        appliedDaysAgo,
        ...rest
      } of applications) {
        await tx.application.create({
          data: {
            ...rest,
            userId: user.id,
            companyId: companyIds.get(company)!,
            appliedAt:
              appliedDaysAgo === undefined ? null : daysAgo(appliedDaysAgo),
            notes: { create: notes.map((content) => ({ content })) },
          },
        });
      }
    });

    console.log(
      `Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD} ` +
        `(${companies.length} companies, ${applications.length} applications)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}
