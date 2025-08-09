import { IsString, Length } from 'class-validator';

export class ConnectVercelDto {
  @IsString()
  @Length(24, 24, { message: 'Vercel API token must be 24 characters long' })
  token: string;
}
