import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { SupabaseService } from '../auth/services/supabase.service';
import { UsageTrackingService } from './services/usage-tracking.service';
import { Request } from 'express';

@Controller('api/v1/user')
@UseGuards(SupabaseAuthGuard)
export class UserController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profile not found' },
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        email: user.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        preferredLanguage: data.preferred_language,
        tier: data.tier,
        createdAt: data.created_at,
      },
    };
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() body: { displayName?: string; preferredLanguage?: string },
  ) {
    const user = (req as any).user;
    const supabase = this.supabaseService.getAdminClient();

    const updates: Record<string, string> = {};
    if (body.displayName !== undefined) updates.display_name = body.displayName;
    if (body.preferredLanguage !== undefined)
      updates.preferred_language = body.preferredLanguage;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update profile' },
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        preferredLanguage: data.preferred_language,
        tier: data.tier,
      },
    };
  }

  @Get('usage')
  async getUsage(@Req() req: Request) {
    const user = (req as any).user;
    return this.usageTrackingService.getDailyUsage(user.id);
  }
}
