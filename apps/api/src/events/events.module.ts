import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AuthModule } from 'src/auth/auth.module'; // <-- Импортируем

@Module({
  imports: [AuthModule], // <-- Добавляем в imports
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
