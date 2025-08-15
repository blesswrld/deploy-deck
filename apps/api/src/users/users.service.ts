import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async _findUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOne(id: string) {
    const user = await this._findUserById(id);
    const { password, ...userWithoutPassword } = user;
    const hasVercelToken = !!user.vercelApiToken;
    const hasGithubToken = !!user.githubAccessToken;
    return {
      ...userWithoutPassword,
      hasVercelToken,
      hasGithubToken,
    };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this._findUserById(userId);

    const isPasswordMatching = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordMatching) {
      throw new ForbiddenException('Incorrect current password');
    }

    // 2. Хэшируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 3. Обновляем пароль в базе
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    await this._findUserById(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
    });

    // Не возвращаем пароль клиенту
    const { password, ...result } = updatedUser;
    return result;
  }
}
