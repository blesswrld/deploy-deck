import { IsString, IsHexColor, MinLength, MaxLength } from 'class-validator';
export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string;

  @IsHexColor()
  color: string;
}
