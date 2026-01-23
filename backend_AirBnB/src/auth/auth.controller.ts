import { 
  Controller, 
  Post, 
  Request, 
  UseGuards,
  Get,
  Body,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public } from './decorate/customize';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {MailerService} from '@nestjs-modules/mailer'
import { VerifyDto } from './dto/verify-email.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) {}

  @ApiOperation({summary: 'Người dùng đăng nhập'})
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @UseGuards(LocalAuthGuard)
  @Public()
  @ApiBody({ type: LoginAuthDto })
  @Post('login')
  async login(@Request() req: any) {
    try {
      const user = req.user as any; 
      
      if (!user) {
        throw new BadRequestException('Thông tin đăng nhập không hợp lệ');
      }

      const { _id, email } = user;
      
      if (!_id || !email) {
        throw new BadRequestException('Thông tin người dùng không đầy đủ');
      }

      return await this.authService.signIn(_id, email);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi đăng nhập: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Lấy thông tin profile thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  getProfile(@Request() req) {
    try {
      if (!req.user) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng');
      }
      return req.user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi lấy thông tin profile: ${error.message}`);
    }
  }

  @ApiOperation({summary: 'Người dùng đăng ký'})
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, vui lòng kiểm tra email để xác thực' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc email đã tồn tại' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Post('register')
  @Public()
  async register(@Body() createUser: CreateAuthDto ){
    try {
      if (!createUser) {
        throw new BadRequestException('Dữ liệu đăng ký không hợp lệ');
      }

      return await this.authService.register(createUser);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi đăng ký: ${error.message}`);
    }
  }

  @Public()
  @ApiOperation({summary: 'Xác thực email'})
  @ApiResponse({ status: 200, description: 'Xác thực email thành công' })
  @ApiResponse({ status: 400, description: 'Mã xác nhận không đúng hoặc đã hết hạn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @Post('verify_email')
  async verifyEmail(@Body() verifyDto: VerifyDto){
    try {
      if (!verifyDto || !verifyDto.email || !verifyDto.codeId) {
        throw new BadRequestException('Dữ liệu xác thực không hợp lệ');
      }

      return await this.authService.verifyEmail(verifyDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi xác thực email: ${error.message}`);
    }
  }

  @ApiOperation({summary: 'Admin đăng nhập'})
  @ApiResponse({ status: 200, description: 'Đăng nhập admin thành công' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  @ApiResponse({ status: 403, description: 'Chỉ admin mới có quyền truy cập' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @UseGuards(LocalAuthGuard)
  @Public()
  @ApiBody({ type: LoginAuthDto })
  @Post('admin/login')
  async adminLogin(@Request() req: any) {
    try {
      const user = req.user as any; 
      
      if (!user) {
        throw new BadRequestException('Thông tin đăng nhập không hợp lệ');
      }

      // Check if user is admin
      if (user.role?.type !== 'admin') {
        throw new ForbiddenException('Chỉ admin mới có quyền truy cập');
      }

      const { _id, email } = user;
      
      if (!_id || !email) {
        throw new BadRequestException('Thông tin người dùng không đầy đủ');
      }
      // Đăng nhập admin: đổi access_token thành admin_token trong response
      const result: any = await this.authService.signIn(_id, email);

      // Nếu không có access_token thì trả về kết quả gốc
      if (!result || !result.access_token) {
        return result;
      }

      const { access_token, ...rest } = result;

      return {
        ...rest,
        admin_token: access_token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi đăng nhập admin: ${error.message}`);
    }
  }
}
