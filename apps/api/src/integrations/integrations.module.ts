import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { AuthModule } from 'src/auth/auth.module'; // <-- Импортируем

@Module({
  imports: [AuthModule], // <-- Добавляем
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
