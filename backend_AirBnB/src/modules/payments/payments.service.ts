import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schemas';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private configService: ConfigService,
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

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update payment status
        await this.paymentModel.findOneAndUpdate(
          { provider_payment_id: paymentIntent.id },
          { status: 'paid' },
        ).exec();

        // Update booking status
        const bookingId = paymentIntent.metadata?.booking_id;
        if (bookingId) {
          await this.bookingModel.findByIdAndUpdate(bookingId, {
            status: 'confirmed',
          }).exec();
        }
      }

      return { received: true };
    } catch (error) {
      throw new InternalServerErrorException(`Webhook error: ${error.message}`);
    }
  }
}
