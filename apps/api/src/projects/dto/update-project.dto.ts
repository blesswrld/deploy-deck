import { IsString, IsUrl, MinLength, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @MinLength(3)
  @IsOptional() // <-- Делаем поле необязательным
  name?: string;

  @IsUrl()
  @IsOptional() // <-- Делаем поле необязательным
  gitUrl?: string;
}
