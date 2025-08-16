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
import { VercelDeployment } from 'src/integrations/integrations.service';

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

  async findAll(userId: string, page: number = 1, limit: number = 5) {
    const skip = (page - 1) * limit;

    // 1. Получаем общее количество проектов для этого пользователя
    const totalProjects = await this.prisma.project.count({
      where: { userId },
    });

    // 2. Получаем только нужную "порцию" проектов
    const userProjects = await this.prisma.project.findMany({
      where: { userId: userId },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
    });

    // 3. АСИНХРОННО ДЛЯ КАЖДОГО ПРОЕКТА ЗАПРАШИВАЕМ СТАТУСЫ
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

    // 4. Возвращаем данные и мета-информацию о пагинации
    return {
      data: projectsWithStatus,
      totalPages: Math.ceil(totalProjects / limit),
      currentPage: page,
      totalCount: totalProjects,
    };
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { tags: true }, // <-- ВКЛЮЧАЕМ ТЕГИ
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    if (project.userId !== userId) {
      throw new ForbiddenException(
        `You do not have permission to access this project`,
      );
    }

    let deployments: VercelDeployment[] = [];
    if (project.vercelProjectId) {
      try {
        const rawDeployments = await this.integrations.getVercelDeployments(
          userId,
          id,
        );
        // Обогащаем деплои аватарками
        deployments = await this.integrations.enrichDeploymentsWithAvatars(
          userId,
          rawDeployments,
        );
      } catch (error) {
        console.error(
          `Failed to fetch deployments for project ${id}:`,
          error.message,
        );
      }
    }

    return { ...project, deployments };
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

  // методы для тегов
  async addTagToProject(projectId: string, tagId: string, userId: string) {
    // Проверка прав доступа
    await this.findOne(projectId, userId);

    // Перед тем как привязать тег, проверяем, существует ли он вообще в базе.
    const tagExists = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tagExists) {
      throw new NotFoundException(`Tag with ID "${tagId}" not found.`);
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: { tags: { connect: { id: tagId } } },
      include: { tags: true },
    });
  }

  async removeTagFromProject(projectId: string, tagId: string, userId: string) {
    await this.findOne(projectId, userId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: { tags: { disconnect: { id: tagId } } },
      include: { tags: true },
    });
  }
}
