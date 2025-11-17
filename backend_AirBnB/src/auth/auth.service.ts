
import { Injectable, UnauthorizedException, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePass } from '@/utils/hashpass';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { VerifyDto } from './dto/verify-email.dto';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService : JwtService
  
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      if (!email || !pass) {
        throw new BadRequestException('Email và mật khẩu không được để trống');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Email không hợp lệ');
      }

      // Validate password not empty
      if (pass.trim().length === 0) {
        throw new BadRequestException('Mật khẩu không được để trống');
      }

      let user;
      try {
        user = await this.usersService.getUserByEmail(email);
      } catch (dbError: any) {
        if (dbError instanceof BadRequestException || dbError instanceof InternalServerErrorException) {
          throw dbError;
        }
        throw new InternalServerErrorException('Lỗi khi truy vấn cơ sở dữ liệu');
      }

      if (!user) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      // Kiểm tra nếu user chưa xác thực email
      if (!user.email_verified) {
        throw new UnauthorizedException('Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.');
      }

      // Kiểm tra nếu tài khoản bị khóa
      if (user.isActive === false) {
        throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');
      }

      let isValid;
      try {
        isValid = await comparePass(pass, user.password);
      } catch (compareError) {
        throw new InternalServerErrorException('Lỗi khi xác thực mật khẩu');
      }

      if (!isValid) {
        throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi xác thực người dùng: ${error.message || 'Lỗi không xác định'}`);
    }
  }

  async getUser(email: string): Promise <any> {
    try {
      if (!email) {
        throw new BadRequestException('Email không được để trống');
      }

      const user = await this.usersService.getUserByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Không tìm thấy người dùng');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi lấy thông tin người dùng: ${error.message}`);
    }
  }

  async signIn(id: string, email: string): Promise<object> {
    try {
      if (!id || !email) {
        throw new BadRequestException('Thông tin đăng nhập không đầy đủ');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Email không hợp lệ');
      }

      const payload = { sud: id, email: email };
      let access_token;
      try {
        access_token = await this.jwtService.signAsync(payload);
      } catch (jwtError) {
        throw new InternalServerErrorException('Lỗi khi tạo token đăng nhập. Vui lòng thử lại');
      }

      if (!access_token) {
        throw new InternalServerErrorException('Không thể tạo token đăng nhập');
      }
      
      return {
        statusCode: 200,
        access_token: access_token,
        id: id,
        email: email
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi tạo token đăng nhập: ${error.message || 'Lỗi không xác định'}`);
    }
  }

  async register(createUser: CreateAuthDto): Promise<any> {
    try {
      if (!createUser) {
        throw new BadRequestException('Dữ liệu đăng ký không hợp lệ');
      }

      return await this.usersService.hanldeRegister(createUser);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi đăng ký: ${error.message}`);
    }
  }

  async verifyEmail(verify_email: VerifyDto): Promise<any> {
    try {
      if (!verify_email || !verify_email.email || !verify_email.codeId) {
        throw new BadRequestException('Dữ liệu xác thực không hợp lệ');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(verify_email.email)) {
        throw new BadRequestException('Email không hợp lệ');
      }

      // Validate codeId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(verify_email.codeId)) {
        throw new BadRequestException('Mã xác nhận không hợp lệ');
      }

      const res = await this.usersService.verifyEmail(verify_email);
      
      // verifyEmail throws exceptions on error, so if we get here, it's successful
      const { id, email } = res;
      if (!id || !email) {
        throw new BadRequestException('Thông tin người dùng không hợp lệ sau khi xác thực');
      }

      const payload = { sud: id, email: email };
      let access_token;
      try {
        access_token = await this.jwtService.signAsync(payload);
      } catch (jwtError) {
        throw new InternalServerErrorException('Lỗi khi tạo token đăng nhập sau xác thực');
      }

      if (!access_token) {
        throw new InternalServerErrorException('Không thể tạo token đăng nhập');
      }
      
      return {
        statusCode: 200,
        access_token: access_token,
        id: id,
        email: email
      };
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof InternalServerErrorException ||
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi xác thực email: ${error.message || 'Lỗi không xác định'}`);
    }
  }
}
