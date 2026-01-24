import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.reviewsService.createForBooking(createReviewDto, userId?.toString?.() || String(userId));
  }

  @Get('by-booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  async getByBooking(@Param('bookingId') bookingId: string, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    const review = await this.reviewsService.findByBookingForUser(
      bookingId,
      userId?.toString?.() || String(userId),
    );
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.reviewsService.updateOwn(id, updateReviewDto, userId?.toString?.() || String(userId));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.reviewsService.removeOwn(id, userId?.toString?.() || String(userId));
  }
}
