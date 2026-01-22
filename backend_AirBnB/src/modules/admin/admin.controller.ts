import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from '@/auth/passport/admin-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy thống kê dashboard admin' })
  async getDashboard(@Req() req: any) {
    const userId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.adminService.getDashboard(userId);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Lấy danh sách tất cả listings (admin)' })
  async getAllListings(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllListings(pageNum, limitNum);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Lấy danh sách tất cả bookings (admin)' })
  async getAllBookings(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllBookings(pageNum, limitNum);
  }

  @Get('users')
  @ApiOperation({ summary: 'Lấy danh sách tất cả users (admin)' })
  async getAllUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllUsers(pageNum, limitNum);
  }

  @Patch('listings/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái listing (admin)' })
  async updateListingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateListingStatus(id, status);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái booking (admin)' })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateBookingStatus(id, status);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái user (admin)' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isActive);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Xóa listing (admin)' })
  async deleteListing(@Param('id') id: string) {
    return this.adminService.deleteListing(id);
  }
}

