import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { ExperienceModule } from './experience/experience.module';
import { FavoriteModule } from './favorite/favorite.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewModule } from './review/review.module';
import { SupportModule } from './support/support.module';
import { VendorModule } from './vendor/vendor.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    VendorModule,
    ExperienceModule,
    BookingModule,
    PaymentModule,
    ReviewModule,
    FavoriteModule,
    SupportModule,
    MediaModule
  ],
})
export class AppModule {}
