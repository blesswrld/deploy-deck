import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  // Внедряем PrismaService через конструктор
  constructor(private prisma: PrismaService) {}

  create(createProjectDto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        userId: userId,
      },
    });
  }

  findAll(userId: string) {
    // <-- Принимаем userId
    // Находим все проекты, где userId совпадает с ID текущего пользователя
    return this.prisma.project.findMany({
      where: {
        userId: userId,
      },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} project`;
  }

  // И здесь: было `id: number`
  update(id: string, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  // И здесь: было `id: number`
  remove(id: string) {
    return `This action removes a #${id} project`;
  }
}
