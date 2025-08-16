import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetUser } from 'src/auth/get-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @GetUser() user: User) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  findAll(
    @GetUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.projectsService.findAll(user.id, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.projectsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: User,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  @Patch(':id/link-vercel')
  linkVercelProject(
    @Param('id') id: string,
    @Body('vercelProjectId') vercelProjectId: string,
    @GetUser() user: User,
  ) {
    return this.projectsService.linkVercelProject(id, vercelProjectId, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.projectsService.remove(id, user.id);
  }

  @Post(':id/tags')
  addTag(
    @Param('id') projectId: string,
    @Body('tagId') tagId: string,
    @GetUser() user: User,
  ) {
    return this.projectsService.addTagToProject(projectId, tagId, user.id);
  }

  @Delete(':id/tags/:tagId')
  removeTag(
    @Param('id') projectId: string,
    @Param('tagId') tagId: string,
    @GetUser() user: User,
  ) {
    return this.projectsService.removeTagFromProject(projectId, tagId, user.id);
  }
}
