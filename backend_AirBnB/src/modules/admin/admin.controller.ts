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

  @Get('listings/:id')
  @ApiOperation({ summary: 'Lấy chi tiết listing với images (admin)' })
  async getListingDetails(@Param('id') id: string) {
    return this.adminService.getListingDetails(id);
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

  @Get('users/:id')
  @ApiOperation({ summary: 'Lấy chi tiết user theo ID (admin)' })
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
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

  @Get('payments')
  @ApiOperation({ summary: 'Lấy danh sách tất cả payments (admin)' })
  async getAllPayments(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllPayments(pageNum, limitNum);
  }

  @Get('payments/stats')
  @ApiOperation({ summary: 'Lấy thống kê payments (admin)' })
  async getPaymentStats(
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getPaymentStats({
      status,
      provider,
      dateRange: startDate && endDate ? [startDate, endDate] : undefined,
    });
  }

  @Get('payments/export')
  @ApiOperation({ summary: 'Xuất danh sách payments sang CSV (admin)' })
  async exportPayments(
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.exportPaymentsCSV({
      status,
      provider,
      dateRange: startDate && endDate ? [startDate, endDate] : undefined,
    });
  }

  @Post('refunds')
  @ApiOperation({ summary: 'Tạo refund cho payment (admin)' })
  async refundPayment(
    @Req() req: any,
    @Body('payment_id') paymentId: string,
    @Body('reason') reason: string,
  ) {
    const adminId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.adminService.refundPayment(paymentId, reason, adminId);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Lấy danh sách tất cả payouts (admin)' })
  async getAllPayouts(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getAllPayouts(pageNum, limitNum);
  }

  @Get('payouts/stats')
  @ApiOperation({ summary: 'Lấy thống kê payouts (admin)' })
  async getPayoutStats() {
    return this.adminService.getPayoutStats();
  }

  @Post('payouts/batch-mark-paid')
  @ApiOperation({ summary: 'Đánh dấu nhiều payouts đã chuyển (admin)' })
  async batchMarkPayoutAsPaid(
    @Req() req: any,
    @Body('payout_ids') payoutIds: string[],
    @Body('admin_note') adminNote?: string,
  ) {
    const adminId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.adminService.batchMarkPayoutAsPaid(payoutIds, adminId, adminNote);
  }

  @Post('payouts/schedule')
  @ApiOperation({ summary: 'Lên lịch payout (admin)' })
  async schedulePayouts(
    @Req() req: any,
    @Body('payout_id') payoutId: string,
    @Body('scheduled_at') scheduledAt: string,
    @Body('send_notification') sendNotification?: boolean,
  ) {
    const adminId = req.user?._id || req.user?.id || req.user?.user_id;
    return this.adminService.schedulePayouts([payoutId], new Date(scheduledAt), sendNotification);
  }

  @Get('payouts/compliance-report')
  @ApiOperation({ summary: 'Xuất báo cáo tuân thủ & thuế (admin)' })
  async generateComplianceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.generateComplianceReport({
      startDate,
      endDate,
      status,
    });
  }

  @Get('settings')
  @ApiOperation({ summary: 'Lấy cài đặt hệ thống (admin)' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Cập nhật cài đặt hệ thống (admin)' })
  async updateSettings(@Body() settingsData: any) {
    return this.adminService.updateSettings(settingsData);
  }
}

