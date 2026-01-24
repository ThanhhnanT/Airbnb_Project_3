import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    if (!userId) {
      throw new BadRequestException('Người dùng chưa đăng nhập');
    }
    return this.bookingsService.create(createBookingDto, userId);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Lấy danh sách bookings của user hiện tại (guest)' })
  getMyBookings(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    console.log('[BookingsController] getMyBookings - req.user:', JSON.stringify(req.user, null, 2));
    console.log('[BookingsController] getMyBookings - userId:', userId);
    console.log('[BookingsController] getMyBookings - status:', status);
    if (!userId) {
      console.error('[BookingsController] getMyBookings - ERROR: No userId found in req.user');
    }
    return this.bookingsService.findGuestBookings(userId, status);
  }

  @Get('host/my-bookings')
  @ApiOperation({ summary: 'Lấy danh sách bookings của host hiện tại' })
  getHostBookings(@Req() req: any, @Query('status') status?: string) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bookingsService.findHostBookings(userId, status);
  }

  @Get('host/listing-counts')
  @ApiOperation({ summary: 'Lấy số lượng đơn đặt theo listing cho host' })
  getListingCounts(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bookingsService.countBookingsByListingForHost(userId);
  }

  @Get('host/stats')
  @ApiOperation({ summary: 'Lấy thống kê doanh thu theo listing cho host' })
  getListingStats(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bookingsService.getBookingStatsForHost(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
