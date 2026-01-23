import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '@/auth/decorate/customize';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerifyDto } from '../../auth/dto/verify-email.dto';
import { CreateStripeAccountDto } from './dto/stripe-connect.dto';

@ApiTags('Admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('create-user')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: string, @Query('page') page: string) {
    return this.usersService.findAll(query, +page);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  // Stripe Connect endpoints
  @Post('stripe-connect/create')
  @ApiOperation({ summary: 'Tạo Stripe Connect account cho host' })
  async createStripeConnectAccount(
    @Body() createStripeAccountDto: CreateStripeAccountDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.user_id;
    return this.usersService.createStripeConnectAccount(userId, createStripeAccountDto);
  }

  @Get('stripe-connect/account-link')
  @ApiOperation({ summary: 'Lấy link để host đăng ký Stripe Connect account' })
  async getStripeConnectAccountLink(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.usersService.getStripeConnectAccountLink(userId);
  }

  @Get('stripe-connect/status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái Stripe Connect account' })
  async getStripeAccountStatus(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.usersService.getStripeAccountStatus(userId);
  }

  @Post('stripe-connect/verify')
  @ApiOperation({ summary: 'Verify Stripe Connect account status' })
  async verifyStripeAccount(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.usersService.verifyStripeAccount(userId);
  }

}
