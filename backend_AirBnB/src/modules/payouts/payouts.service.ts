import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payout, PayoutDocument } from './schemas/payout.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { BankAccount, BankAccountDocument } from '../users/schemas/bank-account.schema';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class PayoutsService {
  private stripe: Stripe;
  private PLATFORM_FEE_PERCENTAGE: number = 10; // 10%

  constructor(
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BankAccount.name) private bankAccountModel: Model<BankAccountDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
    // Override with env if provided
    const envFee = this.configService.get<number>('PLATFORM_FEE_PERCENTAGE');
    if (envFee) {
      this.PLATFORM_FEE_PERCENTAGE = envFee;
    }
  }

  async create(createPayoutDto: CreatePayoutDto): Promise<PayoutDocument> {
    try {
      const createdPayout = new this.payoutModel(createPayoutDto);
      return await createdPayout.save();
    } catch (error) {
      throw new InternalServerErrorException(`Error creating payout: ${error.message}`);
    }
  }

  async findAll(hostId?: string): Promise<Payout[]> {
    try {
      const filter = hostId ? { host_id: hostId } : {};
      return await this.payoutModel
        .find(filter)
        .populate('host_id', 'name email')
        .populate('booking_id', 'check_in check_out total_price')
        .populate('bank_account_id', 'bank_name account_number account_holder_name')
        .populate('processed_by', 'name')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding payouts: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Payout> {
    try {
      const payout = await this.payoutModel.findById(id).populate('host_id booking_id').exec();
      if (!payout) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
      return payout;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding payout: ${error.message}`);
    }
  }

  async update(id: string, updatePayoutDto: UpdatePayoutDto): Promise<Payout> {
    try {
      const updatedPayout = await this.payoutModel
        .findByIdAndUpdate(id, updatePayoutDto, { new: true })
        .exec();
      if (!updatedPayout) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
      return updatedPayout;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating payout: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.payoutModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Payout with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting payout: ${error.message}`);
    }
  }

  // Calculate platform fee and payout amount
  calculatePayoutAmount(totalPrice: number): { platformFee: number; payoutAmount: number } {
    const platformFee = (totalPrice * this.PLATFORM_FEE_PERCENTAGE) / 100;
    const payoutAmount = totalPrice - platformFee;
    return {
      platformFee: Math.round(platformFee * 100) / 100, // Round to 2 decimal places
      payoutAmount: Math.round(payoutAmount * 100) / 100,
    };
  }

  // Create payout automatically from payment
  async createPayoutFromPayment(paymentId: string): Promise<PayoutDocument> {
    try {
      // Check if payout already exists for this payment
      const existingPayout = await this.payoutModel.findOne({ payment_id: paymentId }).exec();
      if (existingPayout) {
        return existingPayout; // Idempotency: return existing payout
      }

      // Get payment with booking
      const payment = await this.paymentModel
        .findById(paymentId)
        .populate('booking_id')
        .exec();

      if (!payment) {
        throw new NotFoundException(`Payment with ID ${paymentId} not found`);
      }

      if (payment.status !== 'paid') {
        throw new BadRequestException('Payment must be paid before creating payout');
      }

      const booking = await this.bookingModel.findById(payment.booking_id).exec();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Calculate payout amount
      const { platformFee, payoutAmount } = this.calculatePayoutAmount(payment.amount);

      // Get host's bank account
      // Normalize hostId first
      let hostIdForQuery: Types.ObjectId;
      if (booking.host_id instanceof Types.ObjectId) {
        hostIdForQuery = booking.host_id;
      } else if (typeof booking.host_id === 'string') {
        hostIdForQuery = new Types.ObjectId(booking.host_id);
      } else if ((booking.host_id as any)?._id) {
        hostIdForQuery = new Types.ObjectId((booking.host_id as any)._id);
      } else {
        hostIdForQuery = new Types.ObjectId(String(booking.host_id));
      }
      
      console.log(`[PayoutsService] Looking up host with ID: ${hostIdForQuery.toString()} (original type: ${typeof booking.host_id})`);
      
      const host = await this.userModel.findById(hostIdForQuery).exec();
      
      if (!host) {
        throw new NotFoundException('Host not found');
      }
      
      console.log(`[PayoutsService] Host found: ${host._id.toString()}, role: ${(host as any)?.role?.type}`);

      // Check if host has bank account
      const bankAccount = await this.bankAccountModel.findOne({
        user_id: hostIdForQuery,
        is_primary: true,
      }).exec();
      
      console.log(`[PayoutsService] Host ${hostIdForQuery.toString()} has bank account: ${!!bankAccount}`);

      // Create payout record (even if no bank account - admin will handle later)
      const createPayoutDto: CreatePayoutDto = {
        booking_id: booking._id.toString(),
        payment_id: payment._id.toString(),
        host_id: booking.host_id.toString(),
        amount: payoutAmount,
        platform_fee: platformFee,
        currency: payment.currency,
        bank_account_id: bankAccount?._id.toString(),
      };

      const payout = await this.create(createPayoutDto);

      // Send Socket.IO notification to admin
      try {
        const message = bankAccount 
          ? `Có payout mới cần xử lý: ${payoutAmount} ${payment.currency}`
          : `Có payout mới cần xử lý: ${payoutAmount} ${payment.currency} (Host chưa có thông tin ngân hàng)`;
        
        this.notificationsGateway.sendToAdmin('payout_pending', {
          payout_id: payout._id.toString(),
          host_id: booking.host_id.toString(),
          amount: payoutAmount,
          currency: payment.currency,
          booking_id: booking._id.toString(),
          message: message,
          has_bank_account: !!bankAccount,
        });
      } catch (notifError) {
        console.error('Error sending payout notification:', notifError);
        // Don't throw - payout created successfully
      }

      // If no bank account, also notify host
      if (!bankAccount) {
        try {
          // Use normalized hostId from above
          const hostId = hostIdForQuery.toString();
          
          console.log(`[PayoutsService] Sending bank_account_required notification to host: ${hostId}`);
          console.log(`[PayoutsService] Host ID from booking: ${booking.host_id}, normalized: ${hostId}`);
          
          this.notificationsGateway.sendToHost(
            hostId,
            'bank_account_required',
            {
              payment_id: payment._id.toString(),
              booking_id: booking._id.toString(),
              amount: payment.amount,
              currency: payment.currency,
              message: 'Có khách đặt phòng của bạn, vui lòng cung cấp tài khoản ngân hàng',
              action_url: '/host/bank-account',
            },
          );
          console.log(`[PayoutsService] Notification sent successfully to host: ${hostId}`);
        } catch (notifError) {
          console.error('Error sending bank account required notification:', notifError);
        }
      } else {
        console.log(`[PayoutsService] Host ${hostIdForQuery.toString()} already has bank account, skipping notification`);
      }

      return payout;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error creating payout from payment: ${error.message}`,
      );
    }
  }

  // Process payout to Stripe (create transfer)
  async processPayoutToStripe(payoutId: string): Promise<Payout> {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const payout = await this.payoutModel.findById(payoutId).exec();
      if (!payout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found`);
      }

      if (payout.status !== 'pending') {
        throw new BadRequestException(`Payout is already ${payout.status}`);
      }

      if (!payout.stripe_account_id) {
        throw new BadRequestException('Stripe account ID is missing');
      }

      // Get payment to get charge ID
      const payment = await this.paymentModel.findById(payout.payment_id).exec();
      if (!payment || !payment.provider_payment_id) {
        throw new NotFoundException('Payment or payment intent ID not found');
      }

      // Retrieve payment intent to get charge ID
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        payment.provider_payment_id,
      );

      if (!paymentIntent.latest_charge) {
        throw new BadRequestException('Payment charge not found');
      }

      // Get charge to transfer
      const charge = await this.stripe.charges.retrieve(
        paymentIntent.latest_charge as string,
      );

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(payout.amount * 100);

      // Create transfer to host's Stripe Connect account
      const transfer = await this.stripe.transfers.create({
        amount: amountInCents,
        currency: payout.currency.toLowerCase(),
        destination: payout.stripe_account_id,
        source_transaction: charge.id,
        metadata: {
          payout_id: payout._id.toString(),
          booking_id: payout.booking_id.toString(),
          payment_id: payout.payment_id.toString(),
        },
      });

      // Update payout with transfer ID and status
      const updatedPayout = await this.payoutModel.findByIdAndUpdate(
        payoutId,
        {
          provider_payout_id: transfer.id,
          status: 'paid',
          processed_at: new Date(),
        },
        { new: true },
      ).exec();

      if (!updatedPayout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found after update`);
      }

      return updatedPayout;
    } catch (error) {
      // Update payout status to failed
      await this.payoutModel.findByIdAndUpdate(
        payoutId,
        { status: 'failed' },
      ).exec();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error processing payout to Stripe: ${error.message}`,
      );
    }
  }

  // Find payouts for a specific host
  async findHostPayouts(hostId: string, status?: string): Promise<Payout[]> {
    try {
      const filter: any = { host_id: hostId };
      if (status) {
        filter.status = status;
      }
      return await this.payoutModel
        .find(filter)
        .populate('host_id booking_id payment_id')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding host payouts: ${error.message}`,
      );
    }
  }

  // Get payout statistics for a host
  async getPayoutStats(hostId: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    failed: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
  }> {
    try {
      const payouts = await this.payoutModel.find({ host_id: hostId }).exec();

      const stats = {
        total: payouts.length,
        pending: 0,
        paid: 0,
        failed: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
      };

      payouts.forEach((payout) => {
        stats.totalAmount += payout.amount;
        if (payout.status === 'pending') {
          stats.pending++;
          stats.pendingAmount += payout.amount;
        } else if (payout.status === 'paid') {
          stats.paid++;
          stats.paidAmount += payout.amount;
        } else if (payout.status === 'failed') {
          stats.failed++;
        }
      });

      return stats;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error getting payout stats: ${error.message}`,
      );
    }
  }

  // Admin marks payout as paid (after manual bank transfer)
  async markAsPaid(payoutId: string, adminId: string, note?: string): Promise<PayoutDocument> {
    try {
      const payout = await this.payoutModel.findById(payoutId).exec();
      if (!payout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found`);
      }

      if (payout.status === 'paid') {
        throw new BadRequestException('Payout is already marked as paid');
      }

      const updatedPayout = await this.payoutModel.findByIdAndUpdate(
        payoutId,
        {
          status: 'paid',
          processed_by: adminId,
          processed_at: new Date(),
          admin_note: note || '',
        },
        { new: true },
      ).exec();

      if (!updatedPayout) {
        throw new NotFoundException(`Payout with ID ${payoutId} not found after update`);
      }

      return updatedPayout;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error marking payout as paid: ${error.message}`,
      );
    }
  }
}
