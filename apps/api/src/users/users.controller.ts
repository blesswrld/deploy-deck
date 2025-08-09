import { Controller, Get, UseGuards, Req, Patch, Body } from '@nestjs/common'; // Добавляем Patch и Body
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import type { User } from '@prisma/client';
import { GetUser } from 'src/auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Patch('me/password')
  updatePassword(
    @GetUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }
}
