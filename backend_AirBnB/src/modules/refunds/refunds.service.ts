import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateRefundDto, ApproveRefundDto, RejectRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Refund, RefundDocument } from './schemas/refund.schema';
import { RefundLedger, RefundLedgerDocument } from './schemas/refund-ledger.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { Model, Types } from 'mongoose';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RefundsService {
  constructor(
    @InjectModel(Refund.name) private refundModel: Model<RefundDocument>,
    @InjectModel(RefundLedger.name) private refundLedgerModel: Model<RefundLedgerDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  // Create refund request
  async requestRefund(
    createRefundDto: CreateRefundDto,
    guestId: string,
  ): Promise<Refund> {
    try {
      const { booking_id, reason, description } = createRefundDto;
      
      // guestId is already a string from controller
      const guestIdStr = guestId;
      console.log('[RefundsService] requestRefund - guestIdStr:', guestIdStr);

      // Validate booking exists
      const booking = await this.bookingModel
        .findById(new Types.ObjectId(booking_id))
        .populate('listing_id guest_id host_id')
        .exec();

      if (!booking) {
        throw new NotFoundException(`Booking với ID ${booking_id} không tồn tại`);
      }

      // Verify guest owns the booking
      const bookingGuestId = typeof booking.guest_id === 'string' 
        ? booking.guest_id 
        : booking.guest_id._id.toString();
      
      console.log('[RefundsService] requestRefund - Comparing guest IDs:');
      console.log('  bookingGuestId:', bookingGuestId);
      console.log('  guestIdStr:', guestIdStr);
      
      if (bookingGuestId !== guestIdStr) {
        throw new BadRequestException('Booking không thuộc về bạn');
      }

      // Check booking status
      if (booking.status !== 'confirmed') {
        throw new BadRequestException(
          'Chỉ có thể yêu cầu hoàn tiền cho các booking đã xác nhận',
        );
      }

      // Check if refund can be requested before check-in
      const now = new Date();
      const checkInDate = new Date(booking.check_in);

      if (now >= checkInDate) {
        throw new BadRequestException(
          'Chỉ có thể yêu cầu hoàn tiền trước thời gian check-in',
        );
      }

      // Check if refund already exists for this booking
      const existingRefund = await this.refundModel.findOne({
        booking_id: new Types.ObjectId(booking_id),
        status: { $in: ['pending', 'approved'] },
      });

      if (existingRefund) {
        throw new BadRequestException(
          'Yêu cầu hoàn tiền cho booking này đã tồn tại',
        );
      }

      // Get payment info
      const payment = await this.paymentModel.findById(booking.payment_id);
      if (!payment) {
        throw new NotFoundException('Thông tin thanh toán không tồn tại');
      }

      // Create refund request
      const refund = new this.refundModel({
        booking_id: new Types.ObjectId(booking_id),
        guest_id: new Types.ObjectId(guestIdStr),
        host_id: booking.host_id._id,
        payment_id: booking.payment_id,
        amount: payment.amount,
        currency: payment.currency,
        reason,
        description,
        status: 'pending',
        requested_at: new Date(),
      });

      const savedRefund = await refund.save();

      // Send notifications
      try {
        const guest = booking.guest_id as any;
        const host = booking.host_id as any;
        const listing = booking.listing_id as any;

        // Notify admin
        this.notificationsGateway.sendToAdmin('refund_requested', {
          refund_id: savedRefund._id.toString(),
          booking_id: booking_id,
          guest_name: guest?.name || 'Guest',
          host_name: host?.name || 'Host',
          amount: payment.amount,
          currency: payment.currency,
          listing_title: listing?.title || 'Listing',
          reason,
          message: `Yêu cầu hoàn tiền mới: ${payment.amount} ${payment.currency}`,
        });
      } catch (notifError) {
        console.error('Error sending refund notification:', notifError);
      }

      return savedRefund;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi khi tạo yêu cầu hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get single refund
  async getRefundRequest(refundId: string): Promise<Refund> {
    try {
      const refund = await this.refundModel
        .findById(new Types.ObjectId(refundId))
        .populate('booking_id guest_id host_id admin_id payment_id')
        .exec();

      if (!refund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      return refund;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi khi lấy yêu cầu hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get guest's refunds
  async getGuestRefunds(guestId: string): Promise<Refund[]> {
    try {
      return await this.refundModel
        .find({ guest_id: new Types.ObjectId(guestId) })
        .populate('booking_id guest_id host_id admin_id payment_id')
        .sort({ requested_at: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy danh sách hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get all pending refunds (admin)
  async getPendingRefunds(): Promise<Refund[]> {
    try {
      return await this.refundModel
        .find({ status: 'pending' })
        .populate('booking_id guest_id host_id payment_id')
        .sort({ requested_at: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy danh sách hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get refunds for a host
  async getHostRefunds(hostId: string, status?: string): Promise<Refund[]> {
    try {
      const hostIdStr = hostId;
      const filter: any = {
        host_id: new Types.ObjectId(hostIdStr),
      };
      if (status) {
        filter.status = status;
      }

      return await this.refundModel
        .find(filter)
        .populate('booking_id guest_id host_id admin_id payment_id')
        .sort({ requested_at: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy danh sách hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get all refunds (admin)
  async getAllRefunds(status?: string): Promise<Refund[]> {
    try {
      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      return await this.refundModel
        .find(filter)
        .populate('booking_id guest_id host_id admin_id payment_id')
        .sort({ requested_at: -1 })
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy danh sách hoàn tiền: ${error.message}`,
      );
    }
  }

  // Approve refund and set to pending host confirmation
  async approveRefund(
    refundId: string,
    approveRefundDto: ApproveRefundDto,
    adminId: string,
  ): Promise<Refund> {
    try {
      const refund = await this.refundModel
        .findById(new Types.ObjectId(refundId))
        .populate('booking_id guest_id host_id payment_id')
        .exec();

      if (!refund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      if (refund.status !== 'pending') {
        throw new BadRequestException(
          'Chỉ có thể phê duyệt yêu cầu hoàn tiền đang chờ xử lý',
        );
      }

      // adminId is already a string from controller
      const adminIdStr = adminId;

      // Update refund status to pending host confirmation (not yet processed)
      const updatedRefund = await this.refundModel.findByIdAndUpdate(
        new Types.ObjectId(refundId),
        {
          status: 'pending_host_confirmation',
          host_confirmation_status: 'pending_host_confirmation',
          admin_id: new Types.ObjectId(adminIdStr),
          admin_notes: approveRefundDto.admin_notes,
          approved_at: new Date(),
        },
        { new: true },
      ).exec();

      if (!updatedRefund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      // Send notifications to host and admin
      try {
        const guest = refund.guest_id as any;
        const host = refund.host_id as any;
        const booking = refund.booking_id as any;

        if (host && host._id) {
          // Notify host via socket about pending confirmation
          this.notificationsGateway.sendToUser(host._id.toString(), 'refund_approved_waiting_host_confirmation', {
            refund_id: refundId,
            booking_id: booking._id.toString(),
            guest_name: guest?.name || 'Guest',
            amount: refund.amount,
            currency: refund.currency,
            listing_title: (booking.listing_id as any)?.title || 'Listing',
            message: `Yêu cầu hoàn tiền từ ${guest?.name || 'khách hàng'} đã được phê duyệt - Vui lòng xác nhận`,
          });
        }

        // Notify admin
        this.notificationsGateway.sendToAdmin('refund_approved', {
          refund_id: refundId,
          booking_id: booking._id.toString(),
          guest_name: guest?.name || 'Guest',
          host_name: host?.name || 'Host',
          amount: refund.amount,
          currency: refund.currency,
          message: `Hoàn tiền được phê duyệt, chờ xác nhận từ host: ${refund.amount} ${refund.currency}`,
        });
      } catch (notifError) {
        console.error('Error sending refund approval notification:', notifError);
      }

      return updatedRefund as RefundDocument;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi khi phê duyệt hoàn tiền: ${error.message}`,
      );
    }
  }

  // Reject refund
  async rejectRefund(
    refundId: string,
    rejectRefundDto: RejectRefundDto,
    adminId: string,
  ): Promise<Refund> {
    try {
      const refund = await this.refundModel
        .findById(new Types.ObjectId(refundId))
        .populate('booking_id guest_id host_id')
        .exec();

      if (!refund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      if (refund.status !== 'pending') {
        throw new BadRequestException(
          'Chỉ có thể từ chối yêu cầu hoàn tiền đang chờ xử lý',
        );
      }

      // adminId is already a string from controller
      const adminIdStr = adminId;

      // Update refund status
      const updatedRefund = await this.refundModel.findByIdAndUpdate(
        new Types.ObjectId(refundId),
        {
          status: 'rejected',
          admin_id: new Types.ObjectId(adminIdStr),
          admin_notes: rejectRefundDto.admin_notes,
          approved_at: new Date(),
        },
        { new: true },
      ).exec();

      if (!updatedRefund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      // Send notifications
      try {
        const guest = refund.guest_id as any;
        const host = refund.host_id as any;
        const booking = refund.booking_id as any;

        // Notify admin
        this.notificationsGateway.sendToAdmin('refund_rejected', {
          refund_id: refundId,
          booking_id: booking._id.toString(),
          guest_name: guest?.name || 'Guest',
          host_name: host?.name || 'Host',
          amount: refund.amount,
          currency: refund.currency,
          message: `Hoàn tiền bị từ chối: ${refund.amount} ${refund.currency}`,
        });
      } catch (notifError) {
        console.error('Error sending refund rejection notification:', notifError);
      }

      return updatedRefund as RefundDocument;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi khi từ chối hoàn tiền: ${error.message}`,
      );
    }
  }

  // Get refund stats
  async getRefundStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    totalAmount: number;
  }> {
    try {
      const refunds = await this.refundModel.find().exec();

      const stats = {
        total: refunds.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        totalAmount: 0,
      };

      refunds.forEach((refund) => {
        stats.totalAmount += refund.amount;
        if (refund.status === 'pending') {
          stats.pending++;
        } else if (refund.status === 'approved' || refund.status === 'pending_host_confirmation') {
          stats.approved++;
        } else if (refund.status === 'rejected') {
          stats.rejected++;
        } else if (refund.status === 'completed' || refund.status === 'confirmed_by_host') {
          stats.completed++;
        }
      });

      return stats;
    } catch (error) {
      throw new InternalServerErrorException(
        `Lỗi khi lấy thống kê hoàn tiền: ${error.message}`,
      );
    }
  }

  // Host confirms refund and processes Stripe refund
  async confirmRefundAsHost(refundId: string, hostId: string): Promise<Refund> {
    try {
      const refund = await this.refundModel
        .findById(new Types.ObjectId(refundId))
        .populate('booking_id guest_id host_id payment_id')
        .exec();

      if (!refund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      // Verify host owns the booking
      const hostIdStr = hostId;
      const refundHostId = typeof refund.host_id === 'string' 
        ? refund.host_id 
        : refund.host_id._id.toString();

      if (refundHostId !== hostIdStr) {
        throw new BadRequestException('Hoàn tiền không thuộc về bạn');
      }

      if (refund.status !== 'pending_host_confirmation') {
        throw new BadRequestException(
          'Chỉ có thể xác nhận hoàn tiền đang chờ xác nhận từ host',
        );
      }

      // Get payment info for Stripe refund
      const payment = refund.payment_id as any;
      if (!payment) {
        throw new NotFoundException('Thông tin thanh toán không tồn tại');
      }

      // Process refund via Stripe
      const stripeRefund = await this.paymentsService.refundPayment(
        payment._id.toString(),
        `Refund confirmed by host - Reason: ${refund.reason}`,
        hostIdStr,
      );

      // Update refund status
      const updatedRefund = await this.refundModel.findByIdAndUpdate(
        new Types.ObjectId(refundId),
        {
          status: 'confirmed_by_host',
          host_confirmation_status: 'confirmed_by_host',
          host_confirmed_at: new Date(),
          stripe_refund_id: stripeRefund.provider_payment_id,
          completed_at: new Date(),
        },
        { new: true },
      ).exec();

      if (!updatedRefund) {
        throw new NotFoundException(`Yêu cầu hoàn tiền với ID ${refundId} không tồn tại`);
      }

      // Update booking status to cancelled
      const booking = refund.booking_id as any;
      await this.bookingModel.findByIdAndUpdate(
        new Types.ObjectId(booking._id),
        { status: 'cancelled' },
      ).exec();

      // Create refund ledger entry for revenue tracking
      try {
        await this.refundLedgerModel.create({
          booking_id: new Types.ObjectId(booking._id),
          host_id: new Types.ObjectId(hostIdStr),
          refund_id: new Types.ObjectId(refundId),
          amount: refund.amount,
          currency: refund.currency,
          confirmed_date: new Date(),
          type: 'refund',
          status: 'confirmed',
        });
      } catch (ledgerError) {
        console.error('Error creating refund ledger entry:', ledgerError);
      }

      // Send notifications
      try {
        const guest = refund.guest_id as any;
        const host = refund.host_id as any;

        // Notify admin
        this.notificationsGateway.sendToAdmin('refund_confirmed_by_host', {
          refund_id: refundId,
          booking_id: booking._id.toString(),
          guest_name: guest?.name || 'Guest',
          host_name: host?.name || 'Host',
          amount: refund.amount,
          currency: refund.currency,
          message: `Hoàn tiền được xác nhận bởi host: ${refund.amount} ${refund.currency}`,
        });
      } catch (notifError) {
        console.error('Error sending refund confirmation notification:', notifError);
      }

      return updatedRefund as RefundDocument;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Lỗi khi xác nhận hoàn tiền: ${error.message}`,
      );
    }
  }
}
