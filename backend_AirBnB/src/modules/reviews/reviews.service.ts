import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schemas';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Listing.name) private listingModel: Model<ListingDocument>,
  ) {}

  private normalizeObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    return new Types.ObjectId(id);
  }

  private sameId(a: any, b: any): boolean {
    if (!a || !b) return false;
    const as = (a instanceof Types.ObjectId ? a.toString() : String(a));
    const bs = (b instanceof Types.ObjectId ? b.toString() : String(b));
    return as === bs;
  }

  private async recalculateListingRating(listingId: Types.ObjectId): Promise<void> {
    const listingIdForQuery = [listingId, listingId.toString()];
    const reviews = await this.reviewModel
      .find({ listing_id: { $in: listingIdForQuery } })
      .select('rating')
      .lean()
      .exec();

    const count = reviews.length;
    const avg =
      count === 0 ? 0 : reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / count;

    await this.listingModel
      .findByIdAndUpdate(
        listingId,
        { avg_rating: avg, review_count: count },
        { new: false },
      )
      .exec();
  }

  async createForBooking(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    try {
      const bookingObjectId = this.normalizeObjectId(createReviewDto.booking_id);
      const booking = await this.bookingModel.findById(bookingObjectId).lean().exec();
      if (!booking) throw new NotFoundException('Booking not found');

      // Ownership
      if (!this.sameId(booking.guest_id, userId)) {
        throw new ForbiddenException('Bạn không có quyền đánh giá booking này');
      }

      // Booking status must be confirmed/completed
      if (!['confirmed', 'completed'].includes(String((booking as any).status))) {
        throw new BadRequestException('Booking chưa được xác nhận');
      }

      // Must have paid payment
      const paymentId = (booking as any).payment_id;
      if (!paymentId) {
        throw new BadRequestException('Booking chưa có thanh toán');
      }
      const payment = await this.paymentModel.findById(paymentId).lean().exec();
      if (!payment || String((payment as any).status) !== 'paid') {
        throw new BadRequestException('Booking chưa thanh toán thành công');
      }

      // Only after checkout
      const checkOut = new Date((booking as any).check_out);
      if (isNaN(checkOut.getTime())) {
        throw new InternalServerErrorException('Booking có check_out không hợp lệ');
      }
      if (Date.now() <= checkOut.getTime()) {
        throw new BadRequestException('Chỉ có thể đánh giá sau ngày check-out');
      }

      // Ensure one review per booking
      const existing = await this.reviewModel
        .findOne({ booking_id: { $in: [bookingObjectId, createReviewDto.booking_id] } })
        .exec();
      if (existing) {
        throw new BadRequestException('Booking này đã được đánh giá');
      }

      const listingId = (booking as any).listing_id;
      const createdReview = new this.reviewModel({
        listing_id: listingId,
        booking_id: bookingObjectId,
        reviewer_id: this.normalizeObjectId(userId),
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      });

      let saved: ReviewDocument;
      try {
        saved = await createdReview.save();
      } catch (e: any) {
        // Handle unique index race
        if (e?.code === 11000) {
          throw new BadRequestException('Booking này đã được đánh giá');
        }
        throw e;
      }

      await this.recalculateListingRating(
        listingId instanceof Types.ObjectId ? listingId : new Types.ObjectId(listingId),
      );

      return saved;
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating review: ${error.message}`);
    }
  }

  async findAll(listingId?: string, targetUserId?: string): Promise<Review[]> {
    try {
      const filter: any = {};
      if (listingId) filter.listing_id = listingId;
      if (targetUserId) filter.target_user_id = targetUserId;
      return await this.reviewModel.find(filter).populate('listing_id reviewer_id target_user_id').exec();
    } catch (error) {
      throw new InternalServerErrorException(`Error finding reviews: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findById(id).populate('listing_id reviewer_id target_user_id').exec();
      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding review: ${error.message}`);
    }
  }

  async findByBookingForUser(bookingId: string, userId: string): Promise<Review | null> {
    const bookingObjectId = this.normalizeObjectId(bookingId);
    return this.reviewModel
      .findOne({
        booking_id: { $in: [bookingObjectId, bookingId] },
        reviewer_id: { $in: [this.normalizeObjectId(userId), userId] },
      })
      .populate('reviewer_id', 'name avatar_url')
      .exec();
  }

  async updateOwn(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<Review> {
    try {
      const review = await this.reviewModel.findById(id).exec();
      if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
      if (!this.sameId((review as any).reviewer_id, userId)) {
        throw new ForbiddenException('Bạn không có quyền sửa review này');
      }

      if (typeof (updateReviewDto as any).rating !== 'undefined') {
        (review as any).rating = (updateReviewDto as any).rating;
      }
      if (typeof (updateReviewDto as any).comment !== 'undefined') {
        (review as any).comment = (updateReviewDto as any).comment;
      }

      const saved = await review.save();
      await this.recalculateListingRating(saved.listing_id as any);
      return saved;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating review: ${error.message}`);
    }
  }

  async removeOwn(id: string, userId: string): Promise<void> {
    try {
      const review = await this.reviewModel.findById(id).exec();
      if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
      if (!this.sameId((review as any).reviewer_id, userId)) {
        throw new ForbiddenException('Bạn không có quyền xoá review này');
      }
      const listingId = review.listing_id as any;
      await this.reviewModel.findByIdAndDelete(id).exec();
      await this.recalculateListingRating(listingId);
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting review: ${error.message}`);
    }
  }
}
