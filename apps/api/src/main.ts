import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  // Number of reverse proxies in front of the app (e.g. 1 behind the Ingress/ALB).
  // Needed so rate limiting sees the client IP from X-Forwarded-For instead of the proxy IP.
  // Leave unset when the API is exposed directly, otherwise clients could spoof their IP.
  const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
  if (trustProxy > 0) {
    app.set('trust proxy', trustProxy);
  }

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
