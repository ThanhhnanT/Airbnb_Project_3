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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({summary: 'Người dùng đăng nhập'})
  @UseGuards(LocalAuthGuard)
  @Public()
  @ApiBody({ type: CreateAuthDto })
  @Post('login')
  async login(@Request() req) {
    const user = req.user as any; 
    console.log(user)
    const { id, email } = user;
    return this.authService.signIn( id, email);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({summary: 'Người dùng đăng ký'})
  @Post('register')
  @Public()
  async register(@Body() createUser: CreateAuthDto ){
    return this.authService.register(createUser)
  }
}
