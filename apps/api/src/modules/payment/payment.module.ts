import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
