import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsStatsService } from './listings-stats.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingDto } from './dto/search-listing.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingsStatsService: ListingsStatsService,
  ) {}

  @Public()
  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm listings' })
  search(@Body() searchDto: SearchListingDto) {
    return this.listingsService.search(searchDto);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo listing mới (host)' })
  create(@Body() createListingDto: CreateListingDto, @Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    // Override host_id with authenticated user
    createListingDto.host_id = userId;
    return this.listingsService.create(createListingDto);
  }

  @Get('host/dashboard-stats')
  @ApiOperation({ summary: 'Lấy thống kê dashboard cho host' })
  async getHostDashboardStats(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    console.log('[Controller] getHostDashboardStats called for userId:', userId);
    const result = await this.listingsStatsService.getHostDashboardStats(userId);
    console.log('[Controller] Dashboard stats result:', JSON.stringify(result, null, 2));
    return result;
  }

  @Get('host/my-listings')
  @ApiOperation({ summary: 'Lấy danh sách listings của host' })
  getHostListings(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.listingsService.findHostListings(userId);
  }

  @Get('host/:id/analytics')
  @ApiOperation({ summary: 'Lấy thống kê & phân tích cho listing của host' })
  async getHostListingAnalytics(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.listingsService.getHostListingAnalytics(id, userId);
  }

  @Public()
  @Get()
  findAll(@Query() query?: string) {
    return this.listingsService.findAll(query);
  }

  @Public()
  @Get(':id/details')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đầy đủ của listing (bao gồm reviews, images, availability)' })
  getListingDetails(
    @Param('id') id: string,
    @Query('checkInDate') checkInDate?: string,
    @Query('checkOutDate') checkOutDate?: string,
    @Query('guests') guests?: string,
  ) {
    const guestsNumber = guests ? parseInt(guests, 10) : undefined;
    return this.listingsService.getListingDetails(id, checkInDate, checkOutDate, guestsNumber);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin cơ bản của listing' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }
}

@ApiTags('Admin Listings')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Lấy thống kê & phân tích cho một listing' })
  getListingAnalytics(@Param('id') id: string) {
    return this.listingsService.getListingAnalytics(id);
  }

  @Get('stats/all')
  @ApiOperation({ summary: 'Lấy thống kê toàn bộ listings' })
  getListingsStats() {
    return this.listingsService.getListingsStats();
  }

  @Patch('bulk/update')
  @ApiOperation({ summary: 'Cập nhật hàng loạt listings' })
  bulkUpdate(@Body() body: { ids: string[]; updateData: UpdateListingDto }) {
    return this.listingsService.bulkUpdateListings(body.ids, body.updateData);
  }
}
