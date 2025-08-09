import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // Используем SERVICE_KEY на бэкенде
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Service Key not found in .env');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient() {
    return this.supabase;
  }
}
