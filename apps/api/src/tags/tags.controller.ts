import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto, @GetUser() user: User) {
    return this.tagsService.create(createTagDto, user.id);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.tagsService.findAll(user.id);
  }

  // ЭНДПОИНТ DELETE /tags/:id
  @Delete(':id')
  remove(@Param('id') tagId: string, @GetUser() user: User) {
    return this.tagsService.remove(tagId, user.id);
  }
}
