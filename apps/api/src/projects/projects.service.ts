import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { IntegrationsService } from 'src/integrations/integrations.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  // Внедряем PrismaService через конструктор
  constructor(
    private prisma: PrismaService,
    private integrations: IntegrationsService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const { gitUrl } = createProjectDto;

    // Если gitUrl не пришел (хотя он обязательный по DTO, но для надежности)
    if (!gitUrl) {
      throw new ForbiddenException('Git URL is required to import a project.');
    }

    // Ищем проект с таким же gitUrl. ВАЖНО: ищем по всей базе, а не только у этого юзера,
    // так как gitUrl уникален для всего приложения.
    const existingProject = await this.prisma.project.findUnique({
      where: { gitUrl: gitUrl },
    });

    if (existingProject) {
      // Если проект найден, проверяем, не принадлежит ли он уже этому пользователю
      if (existingProject.userId === userId) {
        throw new ConflictException(
          `You have already imported the project with Git URL: ${gitUrl}`,
        );
      } else {
        // Если он принадлежит другому пользователю - это проблема безопасности.
        throw new ForbiddenException(
          `This project's Git URL is already in use by another account.`,
        );
      }
    }

    // Если все проверки пройдены, создаем проект
    return this.prisma.project.create({
      data: { ...createProjectDto, userId: userId },
    });
  }

  async findAll(userId: string) {
    // 1. ПОЛУЧАЕМ ПРОЕКТЫ ТОЛЬКО ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
    const userProjects = await this.prisma.project.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // 2. АСИНХРОННО ДЛЯ КАЖДОГО ПРОЕКТА ЗАПРАШИВАЕМ СТАТУСЫ
    const projectsWithStatus = await Promise.all(
      userProjects.map(async (project) => {
        const deploymentStatus =
          await this.integrations.getVercelDeploymentStatus(userId, project);
        const commitSha = deploymentStatus?.commitSha;
        const checksStatus = await this.integrations.getGithubChecks(
          userId,
          project,
          commitSha,
        );

        const finalDeploymentStatus = deploymentStatus
          ? {
              ...deploymentStatus,
              commit: deploymentStatus.commit
                ? deploymentStatus.commit.slice(0, 7)
                : null,
            }
          : null;

        return {
          ...project,
          deploymentStatus: finalDeploymentStatus,
          checksStatus,
        };
      }),
    );

    return projectsWithStatus;
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project)
      throw new NotFoundException(`Project with ID "${id}" not found`);
    if (project.userId !== userId)
      throw new ForbiddenException(
        `You do not have permission to access this project`,
      );

    // Получаем историю коммитов и деплоев параллельно
    const [githubCommits, vercelDeployments] = await Promise.all([
      this.integrations.getGithubCommits(userId, project),
      this.integrations.getVercelDeployments(userId, id), // id здесь - это наш projectId
    ]);

    // Создаем Map для быстрого поиска деплоев по хэшу коммита
    const deploymentsMap = new Map(
      vercelDeployments.map((dep) => [dep.commit, dep]),
    );

    // Объединяем данные: основа - коммиты из GitHub
    const combinedHistory = githubCommits.map((commit) => {
      const matchingDeployment = deploymentsMap.get(commit.sha);
      return {
        id: matchingDeployment?.id || commit.sha,
        status: matchingDeployment?.status || 'NOT_DEPLOYED',
        branch: commit.branch,
        commit: commit.sha,
        message: commit.message,
        creator: commit.author,
        createdAt: commit.date,
        url: matchingDeployment?.url || commit.url,
      };
    });

    return { ...project, deployments: combinedHistory };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    // Сначала проверяем, что проект существует и принадлежит пользователю
    await this.findOne(id, userId);

    // Если проверка прошла, обновляем проект
    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async linkVercelProject(id: string, vercelProjectId: string, userId: string) {
    // Проверяем, что проект принадлежит пользователю
    await this.findOne(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: { vercelProjectId },
    });
  }

  async remove(id: string, userId: string) {
    // Сначала проверяем, что проект существует и принадлежит пользователю
    await this.findOne(id, userId);

    // Если проверка прошла, удаляем проект
    return this.prisma.project.delete({ where: { id } });
  }
}
