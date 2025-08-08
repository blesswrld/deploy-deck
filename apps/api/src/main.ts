import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Импортируем класс

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Меняем порт на 3002, чтобы избежать конфликта с Next.js
  await app.listen(3002);
  console.log(`API is running on: ${await app.getUrl()}`);
}
bootstrap();
