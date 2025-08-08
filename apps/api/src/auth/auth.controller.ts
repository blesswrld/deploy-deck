import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body(new ValidationPipe()) createAuthDto: CreateAuthDto) {
    return this.authService.signup(createAuthDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Для логина принято возвращать статус 200 OK
  login(@Body(new ValidationPipe()) loginDto: CreateAuthDto) {
    return this.authService.login(loginDto);
  }
}
