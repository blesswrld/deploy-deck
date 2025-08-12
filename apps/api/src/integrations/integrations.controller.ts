import {
  Body,
  Controller,
  Post,
  Patch,
  UseGuards,
  Get,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  Delete,
  NotFoundException,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import type { User } from '@prisma/client';
import { ConnectVercelDto } from './dto/connect-vercel.dto';
import type { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsGateway } from 'src/events/events.gateway'; // <-- Импортируем наш Gateway

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

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

  // @Get('vercel/deployments/:projectId')
  // @UseGuards(JwtAuthGuard)
  // getVercelDeploymentStatus(
  //   @GetUser() user: User,
  //   @Param('projectId') projectId: string,
  // ) {
  //   return this.integrationsService.getVercelDeploymentStatus(
  //     user.id,
  //     projectId,
  //   );
  // }

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

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.connectGithub(userId, code);
      // Добавляем параметр ?github-status=success к URL
      res.redirect('http://localhost:3000/settings?github-status=success');
    } catch (error) {
      // Если произошла ошибка (например, GitHub уже привязан), редиректим с ошибкой
      const errorMessage = encodeURIComponent(error.message);
      res.redirect(
        `http://localhost:3000/settings?github-status=error&message=${errorMessage}`,
      );
    }
  }

  @Delete('vercel')
  @UseGuards(JwtAuthGuard)
  disconnectVercel(@GetUser() user: User) {
    return this.integrationsService.disconnectVercel(user.id);
  }

  // ЭНДПОИНТ ДЛЯ ВЕБХУКОВ GITHUB
  @Post('github/webhook')
  @HttpCode(HttpStatus.OK)
  async handleGithubWebhook(@Body() payload: any) {
    // В продакшене здесь нужно проверять подпись вебхука

    // Нас интересует событие, когда статус проверки (check run) меняется
    if (payload.action === 'completed' && payload.check_run) {
      const repoFullName = payload.repository.full_name; // e.g., "blesswrld/deploy-deck"

      // Находим наш проект по gitUrl
      const project = await this.integrationsService.findProjectByGitUrl(
        `https://github.com/${repoFullName}`,
      );

      if (project) {
        // Получаем свежие, агрегированные данные для этого проекта
        const updatedProjectStatus =
          await this.integrationsService.getProjectDashboardStatus(project);

        // Отправляем обновленные данные пользователю через WebSocket
        this.eventsGateway.sendToUser(
          project.userId,
          'project:updated',
          updatedProjectStatus,
        );
      }
    }

    return;
  }

  @Delete('github')
  @UseGuards(JwtAuthGuard)
  disconnectGithub(@GetUser() user: User) {
    return this.integrationsService.disconnectGithub(user.id);
  }

  @Get('vercel/importable-projects')
  @UseGuards(JwtAuthGuard)
  getImportableVercelProjects(@GetUser() user: User) {
    return this.integrationsService.getImportableVercelProjects(user.id);
  }

  @Post('avatars/upload-url')
  @UseGuards(JwtAuthGuard)
  createAvatarUploadUrl(
    @GetUser() user: User,
    @Body('fileType') fileType: string,
  ) {
    return this.integrationsService.createAvatarUploadUrl(user.id, fileType);
  }

  @Post('vercel/deployments/:deploymentId/redeploy')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK) // Используем POST, но возвращаем 200 OK для удобства
  redeployVercelDeployment(
    @GetUser() user: User,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.integrationsService.redeployVercelDeployment(
      user.id,
      deploymentId,
    );
  }

  @Patch('vercel/deployments/:deploymentId/cancel') // Используем PATCH, т.к. изменяем состояние
  @UseGuards(JwtAuthGuard)
  cancelVercelDeployment(
    @GetUser() user: User,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.integrationsService.cancelVercelDeployment(
      user.id,
      deploymentId,
    );
  }
}
