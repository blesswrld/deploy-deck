import { Global, Module } from '@nestjs/common'; // <-- Импортируем Global
import { EmailService } from './email.service';

@Global() // <-- ДОБАВЛЯЕМ ЭТОТ ДЕКОРАТОР
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
