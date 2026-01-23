import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CreatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schemas';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PayoutsService } from '../payouts/payouts.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => PayoutsService))
    private payoutsService: PayoutsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      const createdPayment = new this.paymentModel(createPaymentDto);
      return await createdPayment.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating payment: ${error.message}`);
    }
  }

  async findAll(bookingId?: string, userId?: string): Promise<Payment[]> {
    try {
      const filter: any = {};
      if (bookingId) filter.booking_id = bookingId;
      if (userId) filter.user_id = userId;
      return await this.paymentModel.find(filter).populate('booking_id user_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding payments: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Payment> {
    try {
      const payment = await this.paymentModel.findById(id).populate('booking_id user_id').exec();
      if (!payment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding payment: ${error.message}`);
    }
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      const updatedPayment = await this.paymentModel
        .findByIdAndUpdate(id, updatePaymentDto, { new: true })
        .exec();
      if (!updatedPayment) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
      return updatedPayment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating payment: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.paymentModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting payment: ${error.message}`);
    }
  }

  async processPayment(processPaymentDto: ProcessPaymentDto, userId: string) {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const { paymentMethodId, amount, currency = 'usd', bookingDetails } = processPaymentDto;

      // Verify booking exists and belongs to user
      const booking = await this.bookingModel.findById(bookingDetails.bookingId).exec();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.guest_id.toString() !== userId) {
        throw new BadRequestException('Booking does not belong to user');
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment/complete`,
        metadata: {
          booking_id: bookingDetails.bookingId,
          listing_id: bookingDetails.listingId,
          user_id: userId,
          host_id: booking.host_id.toString(),
          check_in_date: bookingDetails.checkInDate,
          check_out_date: bookingDetails.checkOutDate,
          number_of_guests: bookingDetails.numberOfGuests.toString(),
        },
      });

      // Create payment record
      const payment = await this.create({
        booking_id: bookingDetails.bookingId,
        user_id: userId,
        amount: amount / 100, // Convert from cents to dollars
        currency: currency.toUpperCase(),
        provider: 'stripe',
        provider_payment_id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      });

      // Update booking status if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        await this.bookingModel.findByIdAndUpdate(bookingDetails.bookingId, {
          status: 'confirmed',
          payment_id: (payment as any)._id,
        }).exec();

        // Create payout immediately (don't rely only on webhook)
        // Safe because createPayoutFromPayment is idempotent (checks existing payout by payment_id)
        try {
          const payout = await this.payoutsService.createPayoutFromPayment((payment as any)._id.toString());
          console.log(`[PaymentsService] processPayment - payout created: ${payout?._id?.toString?.() || payout?._id}`);
        } catch (payoutError: any) {
          console.error('[PaymentsService] processPayment - payout creation failed:', payoutError?.message || payoutError);
        }

        // Notify admin immediately (so dev works even if webhook isn't running)
        try {
          const populatedBooking = await this.bookingModel
            .findById(bookingDetails.bookingId)
            .populate('listing_id guest_id')
            .exec();
          if (populatedBooking) {
            const listing = populatedBooking.listing_id as any;
            this.notificationsGateway.sendToAdmin('payment_new', {
              payment_id: (payment as any)._id.toString(),
              booking_id: bookingDetails.bookingId,
              amount: (payment as any).amount,
              currency: (payment as any).currency,
              guest_name: (populatedBooking.guest_id as any)?.name || 'Guest',
              listing_title: listing?.title || 'Listing',
              message: `Có thanh toán mới: ${(payment as any).amount} ${(payment as any).currency}`,
            });
          }
        } catch (notifError) {
          console.error('[PaymentsService] processPayment - send payment_new failed:', (notifError as any)?.message || notifError);
        }
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: (payment as any)._id,
        status: payment.status,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error processing payment: ${error.message}`);
    }
  }

  async handleWebhook(payload: string, signature: string) {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new InternalServerErrorException('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      switch (event.type) {
        case 'payment_intent.created':
          // Payment intent created - payment record should already exist
          // Just log for tracking
          console.log(`Payment intent created: ${paymentIntent.id}`);
          break;

        case 'payment_intent.succeeded':
          // Update payment status
          const payment = await this.paymentModel.findOneAndUpdate(
            { provider_payment_id: paymentIntent.id },
            { status: 'paid' },
            { new: true },
          ).exec();

          if (!payment) {
            console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
            break;
          }

          // Update booking status
          const bookingId = paymentIntent.metadata?.booking_id;
          if (bookingId) {
            await this.bookingModel.findByIdAndUpdate(bookingId, {
              status: 'confirmed',
              payment_id: payment._id,
            }).exec();
          }

          // Automatically create payout for host (will create even if no bank account)
          try {
            await this.payoutsService.createPayoutFromPayment(payment._id.toString());
            console.log(`Payout created successfully for payment ${payment._id}`);
          } catch (payoutError: any) {
            // Log error but don't fail payment - payout creation is handled in payouts service
            console.error(`Error creating payout for payment ${payment._id}:`, payoutError);
            // Payment succeeded, payout creation failed but will be retried or handled manually
          }

          // Send notification to admin about new payment
          try {
            const booking = await this.bookingModel.findById(bookingId).populate('listing_id guest_id').exec();
            if (booking) {
              const listing = (booking.listing_id as any);
              this.notificationsGateway.sendToAdmin('payment_new', {
                payment_id: payment._id.toString(),
                booking_id: bookingId,
                amount: payment.amount,
                currency: payment.currency,
                guest_name: (booking.guest_id as any)?.name || 'Guest',
                listing_title: listing?.title || 'Listing',
                message: `Có thanh toán mới: ${payment.amount} ${payment.currency}`,
              });
            }
          } catch (notifError) {
            console.error('Error sending payment notification to admin:', notifError);
          }

          // TODO: Send email confirmation to guest
          break;

        case 'payment_intent.payment_failed':
          // Update payment status to failed
          await this.paymentModel.findOneAndUpdate(
            { provider_payment_id: paymentIntent.id },
            { status: 'failed' },
          ).exec();

          // Update booking status back to pending or cancelled
          const failedBookingId = paymentIntent.metadata?.booking_id;
          if (failedBookingId) {
            await this.bookingModel.findByIdAndUpdate(failedBookingId, {
              status: 'pending',
            }).exec();
          }
          break;

        case 'charge.refunded':
          // Handle refund
          const charge = event.data.object as Stripe.Charge;
          const refundedPaymentIntentId = charge.payment_intent as string;

          if (refundedPaymentIntentId) {
            const refundedPayment = await this.paymentModel.findOne({
              provider_payment_id: refundedPaymentIntentId,
            }).exec();

            if (refundedPayment) {
              // Update payment status (could add 'refunded' status)
              await this.paymentModel.findByIdAndUpdate(refundedPayment._id, {
                status: 'failed', // or add 'refunded' status
              }).exec();

              // Update booking status
              const refundedBooking = await this.bookingModel.findById(
                refundedPayment.booking_id,
              ).exec();

              if (refundedBooking) {
                await this.bookingModel.findByIdAndUpdate(refundedBooking._id, {
                  status: 'cancelled',
                }).exec();
              }

              // TODO: Handle payout reversal if payout was already processed
            }
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new InternalServerErrorException(`Webhook error: ${error.message}`);
    }
  }
}
