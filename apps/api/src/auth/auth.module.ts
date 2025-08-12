import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule, // <-- Важно импортировать
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Получаем секрет из переменных окружения
        secret: configService.get<string>('SECRET_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService], // Инжектируем ConfigService в нашу фабрику
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
