import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    // Используем асинхронную фабрику для JwtModule
    JwtModule.registerAsync({
      imports: [ConfigModule], // Импортируем ConfigModule, чтобы получить доступ к ConfigService
      useFactory: async (configService: ConfigService) => ({
        // Получаем секрет из переменных окружения
        secret: configService.get<string>('SECRET_KEY'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService], // Инжектируем ConfigService в нашу фабрику
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
