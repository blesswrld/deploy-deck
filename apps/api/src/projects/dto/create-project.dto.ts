import { IsString, IsUrl, MinLength, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsUrl()
  gitUrl: string;

  // Делаем это поле необязательным, так как оно будет только при импорте
  @IsString()
  @IsOptional()
  vercelProjectId?: string;
}
