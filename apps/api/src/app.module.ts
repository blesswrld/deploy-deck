import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EncryptionService } from './common/encryption/encryption.service';
import { EncryptionModule } from './common/encryption/encryption.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SupabaseModule } from './supabase/supabase.module';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { TagsModule } from './tags/tags.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- Делаем конфиг глобальным
    AuthModule,
    PrismaModule,
    UsersModule,
    ProjectsModule,
    IntegrationsModule,
    EncryptionModule,
    SupabaseModule,
    EmailModule,
    EventsModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
