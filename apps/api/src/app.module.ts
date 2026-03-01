import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { VideoModule } from './modules/video/video.module';
import { ArticleModule } from './modules/article/article.module';
import { PaymentModule } from './modules/payment/payment.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    HealthModule,
    AuthModule,
    UserModule,
    VideoModule,
    ArticleModule,
    PaymentModule,
  ],
})
export class AppModule {}
