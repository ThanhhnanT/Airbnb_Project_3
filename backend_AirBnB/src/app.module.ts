import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/users/users.module';
import { Review } from './modules/reviews/schemas/review.schema';
import { Payout } from './modules/payouts/schemas/payout.schema';
import { Payment } from './modules/payments/schemas/payment.schemas';
import { Notification } from './modules/notifications/schemas/notification.schema';
import { Message } from './modules/messages/schemas/message.schema';
import { Listing } from './modules/listings/schemas/listing.schema';
import { ListingImage } from './modules/listing_images/schemas/listing_image.schema';
import { Favorite } from './modules/favorites/schemas/favorite.schema';
import { Dispute } from './modules/disputes/schemas/dispute.schema';
import { Conservation } from './modules/conservations/schemas/conservation.schema';
import { Calendar } from './modules/calendars/schemas/calendar.schema';
import { Booking } from './modules/bookings/schemas/booking.schema';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/passport/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGGO_URL'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    Review,
    Payout, 
    Payment, Notification,
    Message, Listing,
    ListingImage, 
    Favorite,
    Dispute,
    Conservation,
    Calendar,
    Booking,
    AuthModule,
       MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService)  => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          // ignoreTLS: true,
          secure: true,
          auth: {
            user: configService.get<string>('MAILDEV_INCOMING_USER'),
            pass: configService.get<string>('MAILDEV_INCOMING_PASS'),
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },

        // preview: true,
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(), 
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

  ],
})
export class AppModule {}
