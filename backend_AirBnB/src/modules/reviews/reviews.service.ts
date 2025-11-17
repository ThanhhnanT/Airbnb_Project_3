import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Model } from 'mongoose';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    try {
      const createdReview = new this.reviewModel(createReviewDto);
      return await createdReview.save();
    } catch (error) {
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

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    try {
      const updatedReview = await this.reviewModel
        .findByIdAndUpdate(id, updateReviewDto, { new: true })
        .exec();
      if (!updatedReview) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      return updatedReview;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating review: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.reviewModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error deleting review: ${error.message}`);
    }
  }
}
