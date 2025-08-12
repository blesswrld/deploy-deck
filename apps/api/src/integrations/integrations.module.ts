import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { EncryptionModule } from 'src/common/encryption/encryption.module';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [EncryptionModule, SupabaseModule, EventsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
