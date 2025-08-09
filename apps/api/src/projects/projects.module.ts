import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from 'src/auth/auth.module';
import { IntegrationsModule } from 'src/integrations/integrations.module';

@Module({
  imports: [AuthModule, IntegrationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
