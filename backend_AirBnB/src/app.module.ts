import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '@/modules/users/users.module';
import { ListingsModule } from '@/modules/listings/listings.module';
import { ListingImagesModule } from '@/modules/listing_images/listing_images.module';
import { CalendarsModule } from '@/modules/calendars/calendars.module';
import { BookingsModule } from '@/modules/bookings/bookings.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';
import { FavoritesModule } from '@/modules/favorites/favorites.module';
import { ConservationsModule } from '@/modules/conservations/conservations.module';
import { MessagesModule } from '@/modules/messages/messages.module';
import { PayoutsModule } from '@/modules/payouts/payouts.module';
import { DisputesModule } from '@/modules/disputes/disputes.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
// import { SeedModule } from './seed/seed.module';
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
    ListingsModule,
    ListingImagesModule,
    CalendarsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    FavoritesModule,
    ConservationsModule,
    MessagesModule,
    PayoutsModule,
    DisputesModule,
    NotificationsModule,
    AuthModule,
    // SeedModule,
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
