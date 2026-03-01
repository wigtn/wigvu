import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SupabaseService } from './services/supabase.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [SupabaseService, SupabaseAuthGuard],
  exports: [SupabaseService, SupabaseAuthGuard],
})
export class AuthModule {}
