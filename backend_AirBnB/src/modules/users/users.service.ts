import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import {User} from '@/modules/users/schemas/user.schema'
import {Model } from 'mongoose'
import { hashPassword } from '@/utils/hashpass';
import aqp from 'api-query-params';
import { CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import {MailerService} from '@nestjs-modules/mailer'
import { VerifyDto } from '../../auth/dto/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) 
  private userModel: Model<User>,
  private readonly mailerService: MailerService
  
) {}
  
 isEmailExist = async (email: string): Promise<boolean> => {
  try {
    if (!email) {
      return false;
    }
    const user = await this.userModel.exists({ email: email });
    return !!user;
  } catch (error) {
    throw new InternalServerErrorException(`Lỗi khi kiểm tra email: ${error.message}`);
  }
}

 async create(createUserDto: CreateUserDto) {
    
    const {name, email, password, phone} = createUserDto
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    
    const newUser = await this.userModel.create({
      name: name,
      email: email,
      password: hashPass,
      phone: phone
    })


    return {
      _id: newUser._id
    };
  }

  async findAll(query: string, page: number) {
    let {filter, limit, sort} = aqp(query)
    if(!limit) limit =10
    if (filter.limit) delete filter.limit
    if (filter.page) delete filter.page
    console.log(filter, limit)
    const totalItems = (await this.userModel.find(filter)).length 
    const totalePage = Math.ceil(totalItems/limit)
    const offset = (page - 1) * (+limit)
    const results = await this.userModel.find(filter)
    .limit(limit)
    .skip(offset)
    .sort(sort as any)
    .select('-password')
    return results;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async getUserByEmail(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email không được để trống');
      }
      const user = await this.userModel.findOne({ email: email });
      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi tìm kiếm người dùng: ${error.message}`);
    }
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


  hanldeRegister = async (createUser: CreateAuthDto) => {
    try {
      const { name, email, password, phone } = createUser;

      // Validate input
      if (!name || !email || !password || !phone) {
        throw new BadRequestException('Vui lòng điền đầy đủ thông tin đăng ký');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Email không hợp lệ');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
      }

      // Validate phone format
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone)) {
        throw new BadRequestException('Số điện thoại phải có 10-11 chữ số');
      }

      // Check if email already exists
      const isExist = await this.isEmailExist(email);
      if (isExist) {
        throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác`);
      }

      // Hash password
      let hashPass;
      try {
        hashPass = await hashPassword(password);
      } catch (hashError) {
        throw new InternalServerErrorException('Lỗi khi mã hóa mật khẩu. Vui lòng thử lại');
      }

      // Generate verification code
      const codeId = uuidv4();
      const codeExpired = dayjs().add(1, 'day').toDate();

      // Create user
      let newUser;
      try {
        newUser = await this.userModel.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: hashPass,
          phone: phone.trim(),
          isActive: false,
          email_verified: false,
          codeId: codeId,
          codeExpired: codeExpired
        });
      } catch (createError: any) {
        if (createError.code === 11000) {
          throw new BadRequestException('Email đã tồn tại trong hệ thống');
        }
        throw new InternalServerErrorException('Không thể tạo tài khoản mới. Vui lòng thử lại sau');
      }

      if (!newUser) {
        throw new InternalServerErrorException('Không thể tạo tài khoản mới');
      }

      // Send verification email
      try {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Kích hoạt tài khoản của bạn',
          text: 'Chào mừng bạn đến với AirBnB',
          template: 'register',
          context: {
            name: name,
            activationCode: codeId 
          }
        });
      } catch (mailError) {
        // If email sending fails, delete the user to maintain data consistency
        try {
          await this.userModel.deleteOne({ _id: newUser._id });
        } catch (deleteError) {
          // Log error but don't throw - user is already created
          console.error('Lỗi khi xóa user sau khi gửi email thất bại:', deleteError);
        }
        throw new InternalServerErrorException('Không thể gửi email xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
      }

      return {
        statusCode: 201,
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi đăng ký: ${error.message || 'Lỗi không xác định'}`);
    }
  }
  
  verifyEmail = async (verifyDto: VerifyDto) => {
  try {
    const { email, codeId } = verifyDto;

    // Validate input
    if (!email || !codeId) {
      throw new BadRequestException('Email và mã xác nhận không được để trống');
    }

    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    // Check if email is already verified
    if (user.email_verified) {
      throw new BadRequestException('Email đã được xác thực trước đó');
    }

    // Check if codeId matches
    if (user.codeId !== codeId) {
      throw new BadRequestException('Mã xác nhận không đúng. Vui lòng kiểm tra lại');
    }

    // Check if code is expired
    if (user.codeExpired && new Date() > new Date(user.codeExpired)) {
      throw new BadRequestException('Mã xác nhận đã hết hạn. Vui lòng đăng ký lại');
    }

    // Update user
    const updateResult = await this.userModel.updateOne(
      { email },
      { email_verified: true, codeId: null, isActive: true }
    );

    if (updateResult.matchedCount === 0) {
      throw new NotFoundException('Không tìm thấy người dùng để cập nhật');
    }

    if (updateResult.modifiedCount === 0) {
      throw new InternalServerErrorException('Không thể cập nhật trạng thái xác thực');
    }

    return {
      statusCode: 200,
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    if (error instanceof BadRequestException || 
        error instanceof NotFoundException || 
        error instanceof InternalServerErrorException) {
      throw error;
    }
    throw new InternalServerErrorException(`Lỗi khi xác thực email: ${error.message}`);
  }
};

  // Helper methods for role management
  async setUserAsHost(userId: string, listingId: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      const currentListID = user.role?.listID || [];
      if (!currentListID.includes(listingId)) {
        currentListID.push(listingId);
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          'role.type': 'host',
          'role.listID': currentListID
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('Không thể cập nhật role của người dùng');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi cập nhật role: ${error.message}`);
    }
  }

  async removeListingFromHost(userId: string, listingId: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      if (user.role?.type !== 'host') {
        throw new BadRequestException('Người dùng này không phải là host');
      }

      const currentListID = user.role?.listID || [];
      const updatedListID = currentListID.filter(id => id !== listingId);

      // If no listings left, set role back to guest and remove listID
      if (updatedListID.length === 0) {
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          {
            'role.type': 'guest',
            $unset: { 'role.listID': '' }
          },
          { new: true }
        );

        if (!updatedUser) {
          throw new NotFoundException('Không thể cập nhật role của người dùng');
        }

        return updatedUser;
      }

      // Still has listings, keep as host with updated listID
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          'role.listID': updatedListID
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('Không thể cập nhật role của người dùng');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi xóa listing khỏi host: ${error.message}`);
    }
  }

  isHost(user: User): boolean {
    return user.role?.type === 'host';
  }

  isAdmin(user: User): boolean {
    return user.role?.type === 'admin';
  }

  isGuest(user: User): boolean {
    return user.role?.type === 'guest' || !user.role?.type;
  }

  hasListingAccess(user: User, listingId: string): boolean {
    if (this.isAdmin(user)) {
      return true; // Admin has access to all listings
    }
    if (this.isHost(user)) {
      // Chỉ host mới có listID
      return user.role?.listID?.includes(listingId) || false;
    }
    return false;
  }

  // Set user role to admin (không có listID)
  async setUserAsAdmin(userId: string): Promise<User> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          'role.type': 'admin',
          $unset: { 'role.listID': '' }
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi cập nhật role: ${error.message}`);
    }
  }

  // Set user role to guest (không có listID)
  async setUserAsGuest(userId: string): Promise<User> {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          'role.type': 'guest',
          $unset: { 'role.listID': '' }
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi cập nhật role: ${error.message}`);
    }
  }

  
}
