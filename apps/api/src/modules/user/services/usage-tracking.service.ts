import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../auth/services/supabase.service';

const FREE_TIER_LIMITS = {
  video_analyses: 5,
  article_analyses: 5,
};

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getDailyUsage(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    const tier = profile?.tier || 'free';
    const videoUsed = usage?.video_analyses || 0;
    const articleUsed = usage?.article_analyses || 0;

    return {
      success: true,
      data: {
        tier,
        today: {
          videoAnalyses: videoUsed,
          articleAnalyses: articleUsed,
        },
        limits:
          tier === 'pro'
            ? { videoAnalyses: null, articleAnalyses: null }
            : FREE_TIER_LIMITS,
        remaining:
          tier === 'pro'
            ? { videoAnalyses: null, articleAnalyses: null }
            : {
                videoAnalyses: Math.max(
                  0,
                  FREE_TIER_LIMITS.video_analyses - videoUsed,
                ),
                articleAnalyses: Math.max(
                  0,
                  FREE_TIER_LIMITS.article_analyses - articleUsed,
                ),
              },
      },
    };
  }

  async incrementUsage(
    userId: string,
    type: 'video' | 'article',
  ): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Check user tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    if (profile?.tier === 'pro') {
      // Pro users: track but don't limit
      await this.upsertUsage(userId, today, type);
      return true;
    }

    // Free tier: check limits
    const { data: usage } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    const field =
      type === 'video' ? 'video_analyses' : 'article_analyses';
    const current = usage?.[field] || 0;
    const limit =
      type === 'video'
        ? FREE_TIER_LIMITS.video_analyses
        : FREE_TIER_LIMITS.article_analyses;

    if (current >= limit) {
      return false; // Limit exceeded
    }

    await this.upsertUsage(userId, today, type);
    return true;
  }

  private async upsertUsage(
    userId: string,
    date: string,
    type: 'video' | 'article',
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const field =
      type === 'video' ? 'video_analyses' : 'article_analyses';

    const { data: existing } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('usage_date', date)
      .single();

    if (existing) {
      await supabase
        .from('usage_logs')
        .update({ [field]: (existing[field] || 0) + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('usage_logs').insert({
        user_id: userId,
        usage_date: date,
        [field]: 1,
      });
    }
  }
}
