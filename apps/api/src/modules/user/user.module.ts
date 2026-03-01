import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UsageTrackingService } from './services/usage-tracking.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UsageTrackingService],
  exports: [UsageTrackingService],
})
export class UserModule {}
