import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto, userId: string) {
    // 1. ПРОВЕРКА НА КОЛИЧЕСТВО ТЕГОВ
    const userTagsCount = await this.prisma.tag.count({ where: { userId } });
    if (userTagsCount >= 30) {
      throw new ForbiddenException(
        'You have reached the maximum limit of 30 tags.',
      );
    }

    // 2. ПРОВЕРКА НА ДУБЛИКАТЫ (без учета регистра)
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        userId,
        name: {
          equals: createTagDto.name,
          mode: 'insensitive', // 'insensitive' делает поиск нечувствительным к регистру
        },
      },
    });

    if (existingTag) {
      throw new ConflictException(
        `Tag with name "${createTagDto.name}" already exists.`,
      );
    }

    return this.prisma.tag.create({
      data: { ...createTagDto, userId },
    });
  }

  findAll(userId: string) {
    return this.prisma.tag.findMany({ where: { userId } });
  }

  //  МЕТОД ДЛЯ УДАЛЕНИЯ ТЕГА
  async remove(tagId: string, userId: string) {
    // Сначала убедимся, что тег существует и принадлежит этому пользователю
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${tagId}" not found.`);
    }
    if (tag.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this tag.',
      );
    }

    // Prisma автоматически отвяжет этот тег от всех проектов из-за связи "многие-ко-многим"
    return this.prisma.tag.delete({ where: { id: tagId } });
  }
}
