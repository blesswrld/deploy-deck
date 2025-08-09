import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'; // Добавляем ForbiddenException
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;

    const user = await this.findOne(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    // 1. Проверяем, совпадает ли текущий пароль
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
}
