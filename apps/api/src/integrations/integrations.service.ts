import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { SupabaseService } from 'src/supabase/supabase.service';
import type { Project } from '@prisma/client';

interface VercelDeployment {
  id: string;
  status: string;
  branch: string;
  commit: string;
  message: string;
  creator: string;
  createdAt: string;
  url: string;
}

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private supabase: SupabaseService,
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

    // Проверка 1: Пользователь существует? Если нет, это 401 Unauthorized.
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Проверка 2: Vercel вообще подключен? Если нет, это 403 Forbidden.
    // Это ошибка НЕ аутентификации, а АВТОРИЗАЦИИ (у тебя нет прав на это действие).
    if (!user.vercelApiToken) {
      throw new ForbiddenException('Vercel account is not connected.');
    }

    // Расшифровываем токен
    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      const response = await axios.get(
        'https://api.vercel.com/v9/projects?limit=100',
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        },
      );

      // Просто возвращаем все проекты как есть
      return response.data.projects;
    } catch (error) {
      // Проверка 3: Vercel забанил нас за rate limit или токен невалиден?
      // Это тоже 403 Forbidden, потому что проблема не в нашей сессии, а в доступе к Vercel.
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 403 || error.response?.status === 429)
      ) {
        throw new ForbiddenException(
          'Invalid Vercel API token or rate limit exceeded.',
        );
      }
      // Все остальные ошибки - это 500 Internal Server Error
      throw new Error('Failed to fetch projects from Vercel.');
    }
  }

  async getVercelDeploymentStatus(userId: string, project: Project) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      return null;
    }
    if (!project.vercelProjectId) {
      return { status: 'NOT_LINKED' };
    }
    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);
    try {
      const response = await axios.get(
        `https://api.vercel.com/v6/deployments?projectId=${project.vercelProjectId}&limit=1`,
        { headers: { Authorization: `Bearer ${vercelToken}` } },
      );
      const latestDeployment = response.data.deployments[0];
      if (!latestDeployment) {
        return { status: 'NOT_DEPLOYED' };
      }
      const commit =
        latestDeployment.meta?.githubCommitSha ||
        latestDeployment.meta?.gitCommitSha ||
        null;
      const branch =
        latestDeployment.meta?.githubCommitRef ||
        latestDeployment.meta?.gitCommitRef ||
        null;
      return {
        status: latestDeployment.state,
        branch: branch,
        commit: commit ? commit : null,
        createdAt: latestDeployment.createdAt,
        commitSha: commit,
      };
    } catch (error) {
      console.error(
        `[Vercel] Failed to get deployment status for project ${project.id}`,
        error.message,
      );
      return null;
    }
  }

  async getVercelDeployments(
    userId: string,
    projectId: string,
  ): Promise<VercelDeployment[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new ForbiddenException('Vercel account not connected.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    // Объединяем проверки для чистоты
    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access to this project is denied.');
    }
    if (!project.vercelProjectId) {
      // Возвращаем пустой массив, а не ошибку, если проект просто не связан
      return [];
    }

    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      const response = await axios.get(
        `https://api.vercel.com/v6/deployments?projectId=${project.vercelProjectId}&limit=20`,
        { headers: { Authorization: `Bearer ${vercelToken}` } },
      );

      if (!response.data || !response.data.deployments) {
        return [];
      }
      return response.data.deployments.map(
        (dep: any): VercelDeployment => ({
          id: dep.uid,
          status: dep.state,
          branch:
            dep.meta?.githubCommitRef || dep.meta?.gitCommitRef || 'Unknown',
          commit: dep.meta?.githubCommitSha || dep.meta?.gitCommitSha || 'N/A',
          message:
            dep.meta?.githubCommitMessage ||
            dep.meta?.gitCommitMessage ||
            'No message',
          creator: dep.creator.username,
          createdAt: dep.createdAt,
          url: `https://${dep.url}`,
        }),
      );
    } catch (error) {
      console.error(
        `[IntegrationsService] Failed to fetch deployments for Vercel project ${project.vercelProjectId}`,
        error,
      );
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new ForbiddenException('Invalid Vercel API token.');
      }
      // Возвращаем пустой массив в случае ошибки, чтобы не ломать фронтенд
      return [];
    }
  }

  async getVercelDeploymentLogs(userId: string, deploymentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    if (!user.vercelApiToken) {
      throw new ForbiddenException('Vercel account not connected.');
    }

    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      // Vercel API для получения логов
      const response = await axios.get(
        `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
          responseType: 'text',
        },
      );

      return { logs: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403)
          throw new ForbiddenException('Invalid Vercel API token.');
        if (error.response.status === 404)
          throw new NotFoundException('Deployment not found.');
      }
      throw new Error('Failed to fetch deployment logs from Vercel.');
    }
  }

  async connectGithub(userId: string, code: string) {
    // 1. Обмениваем временный `code` на `access_token`
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      },
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new UnauthorizedException(
        'Failed to retrieve GitHub access token.',
      );
    }

    // 2. Используя полученный токен, запрашиваем данные о пользователе GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { id: githubId, login: githubUsername } = userResponse.data;

    // ПРОВЕРКА ПЕРЕД СОХРАНЕНИЕМ
    const existingConnection = await this.prisma.user.findUnique({
      where: { githubId: githubId },
    });

    if (existingConnection && existingConnection.id !== userId) {
      // Если этот GitHub ID уже используется ДРУГИМ пользователем
      throw new ConflictException(
        'This GitHub account is already linked to another user.',
      );
    }

    // 3. Шифруем и сохраняем
    const encryptedToken = this.encryptionService.encrypt(accessToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        githubId,
        githubUsername,
        githubAccessToken: encryptedToken,
      },
    });

    return { message: 'GitHub account connected successfully.' };
  }

  async getGithubChecks(userId: string, project: Project, commitSha?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.githubAccessToken) return null;

    const gitUrlMatch = project.gitUrl?.match(
      /github\.com\/([^/]+\/[^/]+)(?:\.git)?/,
    );
    if (!gitUrlMatch) return null;

    const repoFullName = gitUrlMatch[1];
    const githubToken = this.encryptionService.decrypt(user.githubAccessToken);
    const authHeaders = { Authorization: `Bearer ${githubToken}` };

    try {
      let shaToFetch = commitSha;

      if (!shaToFetch) {
        try {
          const repoResponse = await axios.get(
            `https://api.github.com/repos/${repoFullName}`,
            { headers: authHeaders },
          );
          const mainBranch = repoResponse.data.default_branch;
          const commitsResponse = await axios.get(
            `https://api.github.com/repos/${repoFullName}/commits?sha=${mainBranch}&per_page=1`,
            { headers: authHeaders },
          );
          shaToFetch = commitsResponse.data[0]?.sha;
        } catch (e) {
          console.error(
            `[GitHub] Could not fetch latest commit for ${repoFullName}, proceeding without SHA.`,
          );
        }
      }

      if (!shaToFetch) {
        return {
          status: 'not_found',
          conclusion: 'neutral',
          url: `https://github.com/${repoFullName}`,
        };
      }

      let state = 'pending';
      let commitPageUrl = `https://github.com/${repoFullName}/commit/${shaToFetch}`;

      try {
        const statusResponse = await axios.get(
          `https://api.github.com/repos/${repoFullName}/commits/${shaToFetch}/status`,
          { headers: authHeaders },
        );
        state = statusResponse.data.state;

        // Запрашиваем URL коммита отдельно, чтобы он был всегда правильным
        const commitResponse = await axios.get(
          `https://api.github.com/repos/${repoFullName}/commits/${shaToFetch}`,
          { headers: authHeaders },
        );
        commitPageUrl = commitResponse.data.html_url;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          console.log(
            `[GitHub] Status for commit ${shaToFetch} is not ready yet (409 Conflict). Treating as 'pending'.`,
          );
        } else {
          throw error;
        }
      }

      let conclusion: string | null = null;
      if (state === 'success') conclusion = 'success';
      if (state === 'failure' || state === 'error') conclusion = 'failure';

      let status = 'completed';
      if (state === 'pending') status = 'in_progress';

      return { status, conclusion, url: commitPageUrl };
    } catch (error) {
      console.error(
        `[GitHub] Failed to get checks for project ${project.id} and commit ${commitSha}:`,
        error.message,
      );
      return null;
    }
  }

  async disconnectVercel(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        vercelApiToken: null, // Просто обнуляем токен
      },
    });
    // Также обнуляем все связанные vercelProjectId у проектов этого пользователя
    await this.prisma.project.updateMany({
      where: { userId },
      data: {
        vercelProjectId: null,
      },
    });
    return { message: 'Vercel account disconnected successfully.' };
  }
  async disconnectGithub(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      // Обнуляем все поля, связанные с GitHub
      data: {
        githubAccessToken: null,
        githubId: null,
        githubUsername: null,
      },
    });
    return { message: 'GitHub account disconnected successfully.' };
  }
  async getImportableVercelProjects(userId: string) {
    // 1. Получаем все проекты из Vercel
    const allVercelProjects = await this.getVercelProjects(userId);

    // 2. Получаем все проекты, которые уже есть в нашей базе
    const existingProjects = await this.prisma.project.findMany({
      where: { userId, vercelProjectId: { not: null } },
      select: { vercelProjectId: true },
    });
    const existingVercelIds = new Set(
      existingProjects.map((p) => p.vercelProjectId),
    );

    // 3. Фильтруем Vercel проекты, оставляя только те, которых еще нет у нас
    const importableProjects = allVercelProjects.filter(
      (vp: any) => !existingVercelIds.has(vp.id),
    );

    // 4. Обогащаем оставшиеся проекты информацией о Git-репозитории
    // Vercel API `/v9/projects` возвращает `link` с типом, например, 'github'
    // и именами org/repo. Мы можем собрать из этого gitUrl.
    const projectsWithGitUrl = importableProjects.map((project: any) => {
      let gitUrl: string | null = null;
      if (project.link?.type === 'github') {
        gitUrl = `https://github.com/${project.link.org}/${project.link.repo}`;
      }
      // TODO: Добавить обработку для GitLab, Bitbucket и т.д.

      return {
        vercelProjectId: project.id,
        name: project.name,
        framework: project.framework,
        gitUrl: gitUrl, // Может быть null, если репозиторий не привязан в Vercel
      };
    });

    return projectsWithGitUrl;
  }
  async createAvatarUploadUrl(userId: string, fileType: string) {
    const supabaseClient = this.supabase.getClient();
    const filePath = `${userId}/${Date.now()}`; // Уникальный путь для файла

    const { data, error } = await supabaseClient.storage
      .from('avatars')
      .createSignedUploadUrl(filePath);

    if (error) {
      throw new Error('Could not create upload URL');
    }
    return data;
  }

  async redeployVercelDeployment(userId: string, deploymentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new ForbiddenException('Vercel account is not configured.');
    }

    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    // 1. Получаем данные об оригинальном деплое, чтобы взять из него информацию
    const originalDeploymentResponse = await axios
      .get(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: { Authorization: `Bearer ${vercelToken}` },
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          throw new NotFoundException(
            'Original deployment to redeploy from not found.',
          );
        }
        throw err;
      });

    const originalDeployment = originalDeploymentResponse.data;
    const projectName = originalDeployment.name;

    // 2. ЯВНО ФОРМИРУЕМ ОБЪЕКТ gitSource
    // Нам нужны тип, ссылка на репозиторий и ветка/коммит (ref)
    const gitSource = {
      type: originalDeployment.meta?.githubDeployment ? 'github' : 'gitlab', // или другая логика определения типа
      repoId: originalDeployment.meta?.githubRepoId,
      ref:
        originalDeployment.meta?.githubCommitRef ||
        originalDeployment.meta?.gitCommitRef,
      sha:
        originalDeployment.meta?.githubCommitSha ||
        originalDeployment.meta?.gitCommitSha,
    };

    // Проверяем, что у нас есть все необходимое для редеплоя
    if (!gitSource.ref || !gitSource.sha) {
      throw new ForbiddenException(
        'Cannot redeploy: original deployment is not linked to a specific Git commit.',
      );
    }

    try {
      // 3. Отправляем запрос с правильно сформированным телом
      const response = await axios.post(
        `https://api.vercel.com/v13/deployments`,
        {
          name: projectName,
          gitSource: gitSource, // Используем наш новый объект
        },
        { headers: { Authorization: `Bearer ${vercelToken}` } },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400) {
          console.error('Vercel API Bad Request:', error.response.data);
          throw new ForbiddenException(
            `Vercel API Error: ${error.response.data.error?.message || 'Bad Request'}`,
          );
        }
        if (error.response.status === 403)
          throw new ForbiddenException('Invalid Vercel API token.');
        if (error.response.status === 404)
          throw new NotFoundException('Project not found on Vercel.');
      }
      console.error('Failed to redeploy on Vercel:', error);
      throw new Error('Failed to redeploy on Vercel.');
    }
  }

  async cancelVercelDeployment(userId: string, deploymentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new ForbiddenException('Vercel account is not configured.');
    }

    const vercelToken = this.encryptionService.decrypt(user.vercelApiToken);

    try {
      // Vercel API для отмены деплоя
      const response = await axios.patch(
        `https://api.vercel.com/v12/deployments/${deploymentId}/cancel`,
        {}, // Тело запроса пустое
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        },
      );
      // Возвращаем обновленные данные деплоя (теперь он будет в статусе CANCELED)
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 403)
          throw new ForbiddenException('Invalid Vercel API token.');
        // Vercel может вернуть 409 Conflict, если деплой уже завершен
        if (error.response.status === 409)
          throw new ConflictException(
            'Deployment cannot be canceled as it is already completed.',
          );
      }
      throw new Error('Failed to cancel deployment on Vercel.');
    }
  }

  async getGithubCommits(userId: string, project: Project) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.githubAccessToken) return [];

    const gitUrlMatch = project.gitUrl?.match(
      /github\.com\/([^/]+\/[^/]+)(?:\.git)?/,
    );
    if (!gitUrlMatch) return [];

    const repoFullName = gitUrlMatch[1];
    const githubToken = this.encryptionService.decrypt(user.githubAccessToken);
    const authHeaders = { Authorization: `Bearer ${githubToken}` };

    try {
      const repoResponse = await axios.get(
        `https://api.github.com/repos/${repoFullName}`,
        { headers: authHeaders },
      );
      const mainBranch = repoResponse.data.default_branch;

      const commitsResponse = await axios.get(
        `https://api.github.com/repos/${repoFullName}/commits?sha=${mainBranch}&per_page=20`,
        { headers: authHeaders },
      );

      return commitsResponse.data.map((c: any) => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
        branch: mainBranch, // Упрощенно, считаем что все из main
      }));
    } catch (error) {
      console.error(
        `[GitHub] Failed to get commits for project ${project.id}:`,
        error.message,
      );
      return [];
    }
  }
}
