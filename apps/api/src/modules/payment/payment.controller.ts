import { Controller, Post, Get, UseGuards, Req, Logger } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('api/v1/payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  @Post('create-checkout')
  @UseGuards(SupabaseAuthGuard)
  async createCheckout(@Req() req: Request) {
    // TODO: Integrate with payment provider (Paddle, Lemon Squeezy, PortOne, etc.)
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Payment provider not yet configured',
      },
    };
  }

  @Post('create-portal')
  @UseGuards(SupabaseAuthGuard)
  async createPortal(@Req() req: Request) {
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Payment provider not yet configured',
      },
    };
  }

  @Get('subscription')
  @UseGuards(SupabaseAuthGuard)
  async getSubscription(@Req() req: Request) {
    const user = (req as any).user;
    return {
      success: true,
      data: {
        userId: user.id,
        tier: 'free',
        subscription: null,
      },
    };
  }
}
