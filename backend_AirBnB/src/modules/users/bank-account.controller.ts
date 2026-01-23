import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/bank-account.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Bank Account')
@Controller('users/bank-account')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Host tạo bank account' })
  async create(
    @Body() createBankAccountDto: CreateBankAccountDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.create(userId, createBankAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Host xem bank account của mình' })
  async findAll(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.findAllByUserId(userId);
  }

  @Get('primary')
  @ApiOperation({ summary: 'Host xem bank account chính' })
  async findPrimary(@Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Host xem bank account cụ thể' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Host cập nhật bank account' })
  async update(
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.update(id, userId, updateBankAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Host xóa bank account' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || req.user?.user_id;
    return this.bankAccountService.remove(id, userId);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Admin verify bank account' })
  async verify(@Param('id') id: string) {
    return this.bankAccountService.verify(id);
  }
}
