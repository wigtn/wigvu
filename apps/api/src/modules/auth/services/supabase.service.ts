import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabaseUrl');
    const serviceRoleKey =
      this.configService.get<string>('supabaseServiceRoleKey');

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.warn('Supabase credentials not configured');
      return;
    }

    this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  async getUser(jwt: string) {
    const { data, error } = await this.adminClient.auth.getUser(jwt);
    if (error) throw error;
    return data.user;
  }
}
