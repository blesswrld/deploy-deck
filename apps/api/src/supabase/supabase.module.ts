import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config'; // <-- ИМПОРТИРУЕМ

@Global()
@Module({
  imports: [ConfigModule], // <-- ДОБАВЛЯЕМ
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
