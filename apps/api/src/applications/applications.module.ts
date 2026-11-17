import { Module } from '@nestjs/common';
import { ApplicationsResolver } from './applications.resolver.js';
import { ApplicationsService } from './applications.service.js';

@Module({
  providers: [ApplicationsService, ApplicationsResolver],
})
export class ApplicationsModule {}
