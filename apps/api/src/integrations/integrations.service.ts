import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';
import { SupabaseService } from 'src/supabase/supabase.service'; // <-- Импортируем

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private supabase: SupabaseService, // <-- Внедряем
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
      throw new UnauthorizedException('User not found');
    }

    // Проверка 2: Vercel вообще подключен? Если нет, это 403 Forbidden.
    // Это ошибка НЕ аутентификации, а АВТОРИЗАЦИИ (у тебя нет прав на это действие).
    if (!user.vercelApiToken) {
      throw new ForbiddenException('Vercel account is not connected.');
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

      // Извлекаем дополнительные данные из объекта meta
      const commit =
        latestDeployment.meta?.githubCommitSha ||
        latestDeployment.meta?.gitCommitSha ||
        null;
      const branch =
        latestDeployment.meta?.githubCommitRef ||
        latestDeployment.meta?.gitCommitRef ||
        null;

      // Возвращаем более подробный объект
      return {
        status: latestDeployment.state, // 'READY', 'BUILDING', 'ERROR'
        branch: branch,
        commit: commit ? commit.slice(0, 7) : null, // Возвращаем короткий хэш (7 символов)
        createdAt: latestDeployment.createdAt,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new UnauthorizedException('Invalid Vercel API token.');
      }
      throw new Error('Failed to fetch deployment status from Vercel.');
    }
  }

  async getVercelDeployments(
    userId: string,
    projectId: string,
    limit: number = 20,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new UnauthorizedException('Vercel account not connected.');
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
        `https://api.vercel.com/v6/deployments?projectId=${project.vercelProjectId}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        },
      );

      if (!response.data || !response.data.deployments) {
        return [];
      }

      // Возвращаем более подробный массив для отображения истории
      return response.data.deployments.map((dep: any) => ({
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
      }));
    } catch (error) {
      console.error(
        `[IntegrationsService] Failed to fetch deployments for Vercel project ${project.vercelProjectId}`,
        error,
      );
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new UnauthorizedException('Invalid Vercel API token.');
      }
      // Возвращаем пустой массив в случае ошибки, чтобы не ломать фронтенд
      return [];
    }
  }

  async getVercelDeploymentLogs(userId: string, deploymentId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.vercelApiToken) {
      throw new UnauthorizedException('Vercel account not connected.');
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
          throw new UnauthorizedException('Invalid Vercel API token.');
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
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { id: githubId, login: githubUsername } = userResponse.data;

    // 3. Шифруем токен и сохраняем все данные в нашу базу
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

  async getGithubChecks(userId: string, projectId: string) {
    // 1. Получаем пользователя и проект, проверяем права и наличие токенов
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.githubAccessToken) {
      throw new UnauthorizedException('GitHub account not connected.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access to this project is denied.');
    }

    // 2. Парсим owner и repo из gitUrl
    // Пример: "https://github.com/blesswrld/deploy-deck.git" -> "blesswrld/deploy-deck"
    const gitUrlMatch = project.gitUrl.match(
      /github\.com\/([^/]+\/[^/]+)(?:\.git)?/,
    );
    if (!gitUrlMatch) {
      throw new NotFoundException(
        `Invalid GitHub repository URL format for: ${project.gitUrl}`,
      );
    }
    const repoFullName = gitUrlMatch[1]; // "blesswrld/deploy-deck"

    // 3. Расшифровываем токен
    const githubToken = this.encryptionService.decrypt(user.githubAccessToken);
    const authHeaders = { Authorization: `Bearer ${githubToken}` };

    try {
      // 4. Получаем последний коммит из главной ветки репозитория
      // Сначала получаем информацию о репозитории, чтобы узнать имя главной ветки
      const repoResponse = await axios.get(
        `https://api.github.com/repos/${repoFullName}`,
        { headers: authHeaders },
      );
      const mainBranch = repoResponse.data.default_branch; // e.g., 'main' or 'master'

      // Теперь получаем последний коммит из этой ветки
      const commitsResponse = await axios.get(
        `https://api.github.com/repos/${repoFullName}/commits?sha=${mainBranch}&per_page=1`,
        { headers: authHeaders },
      );
      const latestCommitSha = commitsResponse.data[0]?.sha;
      const checksPageUrl = commitsResponse.data[0]?.html_url; // <-- ПОЛУЧАЕМ URL

      if (!latestCommitSha) {
        // Если коммитов нет, возвращаем специальный статус
        return { status: 'not_found', conclusion: 'neutral', url: null };
      }

      // 5. Получаем статусы проверок (checks) для этого коммита
      const checksResponse = await axios.get(
        `https://api.github.com/repos/${repoFullName}/commits/${latestCommitSha}/check-runs`,
        { headers: authHeaders },
      );

      const checkRuns = checksResponse.data.check_runs;

      // 6. Агрегируем статусы. Если хоть один 'failure', то общий статус 'failure'.
      // Если хоть один 'in_progress', то 'in_progress'. Иначе 'success'.
      let conclusion: string | null = 'success';
      if (checkRuns.length === 0) {
        // Если проверок нет, считаем, что все хорошо
        conclusion = 'success';
      } else if (
        checkRuns.some(
          (run) =>
            run.conclusion === 'failure' || run.conclusion === 'cancelled',
        )
      ) {
        conclusion = 'failure';
      }

      let status = 'completed';
      if (checkRuns.some((run) => run.status !== 'completed')) {
        status = 'in_progress';
      }

      return { status, conclusion, url: checksPageUrl };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new UnauthorizedException('Invalid GitHub token.');
      }
      console.error(
        `Failed to fetch GitHub checks for ${repoFullName}:`,
        error,
      );
      throw new Error('Failed to fetch GitHub checks.');
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
}
