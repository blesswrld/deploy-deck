import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async connectVercel(userId: string, token: string) {
    // Шифруем токен перед сохранением в базу
    const encryptedToken = this.encryptionService.encrypt(token);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        vercelApiToken: encryptedToken,
      },
    });

    return { message: 'Vercel account connected successfully.' };
  }

  async getVercelProjects(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new UnauthorizedException('Vercel account not connected.');
    }

    // Расшифровываем токен
    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      // Делаем запрос к Vercel API
      const response = await axios.get('https://api.vercel.com/v9/projects', {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
      });

      // Возвращаем только нужные нам данные
      return response.data.projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        framework: project.framework,
      }));
    } catch (error) {
      // Если токен невалидный, Vercel вернет 403 Forbidden
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new UnauthorizedException('Invalid Vercel API token.');
      }
      throw new Error('Failed to fetch projects from Vercel.');
    }
  }

  async getVercelDeploymentStatus(userId: string, projectId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new UnauthorizedException('Vercel account not connected.');
    }

    // Находим проект в нашей базе, чтобы получить vercelProjectId
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Access to this project is denied.');
    }
    if (!project.vercelProjectId) {
      throw new NotFoundException('Project is not linked to Vercel.');
    }

    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      // Делаем запрос к Vercel API на получение списка деплоев для конкретного проекта
      const response = await axios.get(
        `https://api.vercel.com/v6/deployments?projectId=${project.vercelProjectId}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        },
      );

      const latestDeployment = response.data.deployments[0];
      if (!latestDeployment) {
        return { status: 'NOT_DEPLOYED' };
      }

      // Возвращаем только статус
      return { status: latestDeployment.state }; // например, 'READY', 'BUILDING', 'ERROR'
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new UnauthorizedException('Invalid Vercel API token.');
      }
      throw new Error('Failed to fetch deployment status from Vercel.');
    }
  }
}
