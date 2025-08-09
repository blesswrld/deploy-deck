import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import type { User } from '@prisma/client';
import { ConnectVercelDto } from './dto/connect-vercel.dto';
import type { Response } from 'express';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // --- VERCEL ЭНДПОИНТЫ ---
  @Post('vercel')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  getVercelProjects(@GetUser() user: User) {
    return this.integrationsService.getVercelProjects(user.id);
  }

  @Get('vercel/deployments/:projectId')
  @UseGuards(JwtAuthGuard)
  getVercelDeploymentStatus(
    @GetUser() user: User,
    @Param('projectId') projectId: string,
  ) {
    return this.integrationsService.getVercelDeploymentStatus(
      user.id,
      projectId,
    );
  }

  @Get('vercel/deployments/:deploymentId/logs')
  @UseGuards(JwtAuthGuard)
  getVercelDeploymentLogs(
    @GetUser() user: User,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.integrationsService.getVercelDeploymentLogs(
      user.id,
      deploymentId,
    );
  }

  // --- GITHUB ЭНДПОИНТЫ ---
  @Get('github/redirect-url')
  @UseGuards(JwtAuthGuard) // <-- ЗАЩИЩЕН
  @HttpCode(HttpStatus.OK)
  getGithubRedirectUrl(@GetUser() user: User) {
    const state = user.id;
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`;
    return { redirectUrl: url };
  }

  @Get('github/callback') // <-- ПУБЛИЧНЫЙ
  async githubCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    await this.integrationsService.connectGithub(userId, code);
    res.redirect('http://localhost:3000/settings');
  }

  @Get('github/checks/:projectId')
  @UseGuards(JwtAuthGuard)
  getGithubChecks(
    @GetUser() user: User,
    @Param('projectId') projectId: string,
  ) {
    return this.integrationsService.getGithubChecks(user.id, projectId);
  }
}
