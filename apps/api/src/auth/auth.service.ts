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

@Injectable()
export class AuthService {
  // Добавляем JwtService в конструктор
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto; // <-- Получаем `name`

    // Проверяем, не занят ли email
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
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
      },
    });

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
}
