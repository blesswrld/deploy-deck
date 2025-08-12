import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly isVerificationEnabled: boolean;

  // Добавляем JwtService в конструктор
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService, // <-- Внедряем EmailService
    private configService: ConfigService, // <-- Внедряем ConfigService
  ) {
    // Считываем значение переменной ОДИН раз при старте сервиса
    this.isVerificationEnabled =
      this.configService.get('EMAIL_VERIFICATION_ENABLED') === 'true';
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto; // <-- Получаем `name`

    // Проверяем, не занят ли email
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      if (this.isVerificationEnabled && !existingUserByEmail.emailVerified) {
        // эта логика позволяет пользователю "повторно" зарегистрироваться,
        // если он не завершил верификацию в первый раз.
        await this.sendVerificationLink(existingUserByEmail.email);
        return {
          message: 'Verification link sent again. Please check your email.',
        };
      }
      throw new ConflictException('Email already in use');
    }

    // <-- ДОБАВЛЯЕМ ПРОВЕРКУ НА УНИКАЛЬНОСТЬ ИМЕНИ -->
    const existingUserByName = await this.prisma.user.findUnique({
      where: { name },
    });
    if (existingUserByName) {
      throw new ConflictException('Name is already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        email,
        name, // <-- ДОБАВЛЯЕМ `name` В СОЗДАНИЕ
        password: hashedPassword,
        // Сразу верифицируем, если "выключатель" в .env установлен в false
        emailVerified: this.isVerificationEnabled ? null : new Date(),
      },
    });

    // Отправляем письмо, только если верификация включена в .env
    if (this.isVerificationEnabled) {
      await this.sendVerificationLink(user.email);
    }

    // Не возвращаем пароль клиенту
    const { password: _, ...result } = user;
    return result;
  }

  // === МЕТОД LOGIN ===
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Находим пользователя по email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Пропускаем проверку, если верификация отключена в .env
    if (this.isVerificationEnabled && !user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    // 2. Сравниваем пароли
    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Генерируем JWT-токен
    const payload = { sub: user.id, email: user.email, name: user.name };
    const accessToken = await this.jwtService.signAsync(payload);

    // 4. Возвращаем токен
    return {
      accessToken,
    };
  }

  // Выносим логику отправки письма верификации в отдельный метод для переиспользования
  async sendVerificationLink(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Тихо выходим, если пользователя нет

    const payload = { sub: user.id };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('PASSWORD_RESET_SECRET'),
      expiresIn: '24h',
    });
    await this.emailService.sendVerificationLink(user.email, token);
  }

  // метод для обработки верификации по токену
  async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('PASSWORD_RESET_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException(); // Если пользователя удалили

      // Проверяем, не верифицирован ли email уже, чтобы избежать лишних записей в БД
      if (user.emailVerified) {
        return { message: 'Email is already verified.' };
      }

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { emailVerified: new Date() },
      });

      return { message: 'Email verified successfully.' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }
  }

  async sendPasswordResetLink(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // не говорим пользователю, что email не найден, из соображений безопасности.
      // Просто тихо завершаем, как будто письмо отправлено.
      return {
        message:
          'If a user with that email exists, a reset link has been sent.',
      };
    }

    const payload = { sub: user.id };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('PASSWORD_RESET_SECRET'),
      expiresIn: '1h', // Ссылка будет действовать 1 час
    });

    await this.emailService.sendPasswordResetLink(user.email, token);
    return { message: 'Password reset link sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('PASSWORD_RESET_SECRET'),
      });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      return { message: 'Password has been reset successfully.' };
    } catch (error) {
      // Если токен невалиден или просрочен
      throw new UnauthorizedException(
        'Invalid or expired password reset token.',
      );
    }
  }
}
