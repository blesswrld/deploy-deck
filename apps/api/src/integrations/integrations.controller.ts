import { Body, Controller, Post, UseGuards, Get, Param } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import type { User } from '@prisma/client';
import { ConnectVercelDto } from './dto/connect-vercel.dto';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('vercel')
  connectVercel(
    @GetUser() user: User,
    @Body() connectVercelDto: ConnectVercelDto,
  ) {
    return this.integrationsService.connectVercel(
      user.id,
      connectVercelDto.token,
    );
  }

  @Get('vercel/projects')
  getVercelProjects(@GetUser() user: User) {
    return this.integrationsService.getVercelProjects(user.id);
  }

  @Get('vercel/deployments/:projectId')
  getVercelDeploymentStatus(
    @GetUser() user: User,
    @Param('projectId') projectId: string,
  ) {
    return this.integrationsService.getVercelDeploymentStatus(
      user.id,
      projectId,
    );
  }
}
