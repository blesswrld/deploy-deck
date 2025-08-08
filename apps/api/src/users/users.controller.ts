import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  // Этот декоратор защищает весь контроллер (или отдельный роут)
  // Он будет использовать нашу JwtStrategy по умолчанию
  @UseGuards(AuthGuard('jwt'))
  @Get('me') // Роут будет /users/me
  getMe(@Req() req: Request) {
    // После успешной валидации токена, в req.user будет объект пользователя
    return req.user;
  }
}
