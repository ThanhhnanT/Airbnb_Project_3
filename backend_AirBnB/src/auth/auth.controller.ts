import { 
  Controller, 
  Post, 
  Request, 
  UseGuards,
  Get,
  Body
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public } from './decorate/customize';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
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
  @UseGuards(LocalAuthGuard)
  @Public()
  @ApiBody({ type: LoginAuthDto })
  @Post('login')
  async login(@Request() req: any) {
    const user = req.user as any; 
    console.log(user)
    const { _id, email } = user;
    return this.authService.signIn( _id, email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({summary: 'Người dùng đăng ký'})
  @Post('register')
  @Public()
  async register(@Body() createUser: CreateAuthDto ){
    return await this.authService.register(createUser)
  }

  @Public()
  @ApiOperation({summary: 'Xác thực email'})
  @Post('verify_email')
  verifyEmail(@Body() verifyDto: VerifyDto){
    return this.authService.verifyEmail(verifyDto)
  }
}
