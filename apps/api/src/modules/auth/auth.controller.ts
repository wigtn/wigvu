import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getMe(@Req() request: Request) {
    const user = (request as any).user;
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName:
          user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatarUrl:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      },
    };
  }
}
