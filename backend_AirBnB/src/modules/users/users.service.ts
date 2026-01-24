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
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreateStripeAccountDto } from './dto/stripe-connect.dto';

@Injectable()
export class UsersService {
  private stripe: Stripe;

  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }
  
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
    try {
      let { filter, limit, sort } = aqp(query);
      if (!limit) limit = 10;
      if (filter.limit) delete filter.limit;
      if (filter.page) delete filter.page;

      // Build MongoDB query from filters
      const mongoQuery: any = {};

      // Handle search parameter
      if (filter.search) {
        mongoQuery.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { email: { $regex: filter.search, $options: 'i' } }
        ];
        delete filter.search;
      }

      // Handle role filter - map to nested field
      if (filter.role) {
        mongoQuery['role.type'] = filter.role;
        delete filter.role;
      }

      // Handle boolean string conversions
      if (filter.email_verified !== undefined) {
        mongoQuery.email_verified = filter.email_verified === 'true' || filter.email_verified === true;
        delete filter.email_verified;
      }

      if (filter.phone_verified !== undefined) {
        mongoQuery.phone_verified = filter.phone_verified === 'true' || filter.phone_verified === true;
        delete filter.phone_verified;
      }

      if (filter.id_verified !== undefined) {
        mongoQuery.id_verified = filter.id_verified === 'true' || filter.id_verified === true;
        delete filter.id_verified;
      }

      if (filter.isActive !== undefined) {
        mongoQuery.isActive = filter.isActive === 'true' || filter.isActive === true;
        delete filter.isActive;
      }

      // Handle Stripe status filter
      if (filter.stripe_status) {
        mongoQuery.stripe_account_status = filter.stripe_status;
        delete filter.stripe_status;
      }

      // Merge remaining filters
      Object.assign(mongoQuery, filter);

      console.log('MongoDB Query:', mongoQuery);

      // Get total count for pagination
      const totalItems = await this.userModel.countDocuments(mongoQuery);
      const totalPage = Math.ceil(totalItems / limit);
      const offset = (page - 1) * (+limit);

      // Fetch results
      const results = await this.userModel
        .find(mongoQuery)
        .limit(+limit)
        .skip(offset)
        .sort(sort as any)
        .select('-password');

      return results;
    } catch (error) {
      throw new InternalServerErrorException(`Error fetching users: ${error.message}`);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findOneById(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      const user = await this.userModel.findById(id).select('-password');
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error finding user: ${error.message}`);
    }
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // Validate input
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      // Find user first to check if exists
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Prepare update object - only include fields that are provided
      const updateData: any = {};
      
      if (updateUserDto.name !== undefined) {
        updateData.name = updateUserDto.name.trim();
      }
      
      if (updateUserDto.phone !== undefined) {
        updateData.phone = updateUserDto.phone.trim();
      }
      
      if (updateUserDto.avatar_url !== undefined) {
        updateData.avatar_url = updateUserDto.avatar_url;
      }
      
      if (updateUserDto.bio !== undefined) {
        updateData.bio = updateUserDto.bio.trim();
      }

      // Note: We explicitly exclude password and email from updates
      // Password should be updated through a separate endpoint
      // Email should be updated through a separate verification process

      // Update user
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password'); // Exclude password from response

      if (!updatedUser) {
        throw new NotFoundException(`Failed to update user with ID ${id}`);
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error updating user: ${error.message}`);
    }
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

  // Stripe Connect methods
  async createStripeConnectAccount(userId: string, createStripeAccountDto: CreateStripeAccountDto) {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role?.type !== 'host') {
        throw new BadRequestException('Only hosts can create Stripe Connect accounts');
      }

      // Check if account already exists
      if (user.stripe_account_id) {
        throw new BadRequestException('Stripe Connect account already exists for this user');
      }

      const { email, country, type = 'express' } = createStripeAccountDto;

      // Create Stripe Connect account
      let account;
      try {
        const countryCode = country.toUpperCase();
        
        // Determine capabilities based on country
        // Some countries like Vietnam don't support card_payments capability
        const capabilities: any = {
          transfers: { requested: true },
        };

        // Only request card_payments for supported countries
        // Vietnam and some other countries only support transfers
        const countriesWithoutCardPayments = ['VN', 'TH', 'ID', 'PH', 'MY'];
        if (!countriesWithoutCardPayments.includes(countryCode)) {
          capabilities.card_payments = { requested: true };
        }

        // Account creation parameters
        // For cross-border countries (VN, TH, etc.), use controller parameter
        // which automatically creates recipient service agreement account
        const crossBorderCountries = ['VN', 'TH', 'ID', 'PH', 'MY'];
        
        let accountParams: any;
        
        if (crossBorderCountries.includes(countryCode)) {
          // For cross-border countries: use controller parameter with country
          // This creates a recipient service agreement account automatically
          accountParams = {
            email: email || user.email,
            country: countryCode,
            controller: {
              stripe_dashboard: {
                type: 'express',
              },
              fees: {
                payer: 'application',
              },
              losses: {
                payments: 'application',
              },
            },
            // Specify tos_acceptance with service_agreement for recipient accounts
            tos_acceptance: {
              service_agreement: 'recipient',
              date: Math.floor(Date.now() / 1000),
              ip: '0.0.0.0', // Will be updated during onboarding
            },
          };
          // Capabilities will be requested during onboarding
        } else {
          // For other countries: standard account creation
          accountParams = {
            type: type === 'express' ? 'express' : 'standard',
            country: countryCode,
            email: email || user.email,
            capabilities: capabilities,
          };
        }

        account = await this.stripe.accounts.create(accountParams);
      } catch (stripeError: any) {
        if (stripeError?.code === 'account_invalid' || stripeError?.message?.includes('Connect')) {
          throw new BadRequestException(
            'Stripe Connect chưa được kích hoạt. Vui lòng đăng ký Stripe Connect tại https://stripe.com/connect hoặc liên hệ admin để kích hoạt tính năng này.'
          );
        }
        if (stripeError?.message?.includes('card_payments') || stripeError?.message?.includes('capability')) {
          throw new BadRequestException(
            `Quốc gia ${country.toUpperCase()} không hỗ trợ card_payments capability. Chỉ có thể sử dụng transfers. ${stripeError.message}`
          );
        }
        if (stripeError?.message?.includes('service_agreement') || stripeError?.message?.includes('recipient')) {
          // Service agreement will be handled automatically by Stripe during onboarding
          // For cross-border countries, Stripe uses recipient agreement when only transfers is requested
          throw new BadRequestException(
            `Lỗi tạo tài khoản cho quốc gia ${country.toUpperCase()}. Stripe sẽ tự động xử lý service agreement trong quá trình đăng ký. ${stripeError.message}`
          );
        }
        throw stripeError;
      }

      // Update user with Stripe account ID
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          stripe_account_id: account.id,
          stripe_account_status: 'pending',
        },
        { new: true }
      );

      return {
        account_id: account.id,
        status: 'pending',
        message: 'Stripe Connect account created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating Stripe Connect account: ${error.message}`);
    }
  }

  async getStripeConnectAccountLink(userId: string) {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripe_account_id) {
        throw new BadRequestException('Stripe Connect account not found. Please create one first.');
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

      // Create account link for onboarding
      const accountLinkParams: any = {
        account: user.stripe_account_id,
        refresh_url: `${frontendUrl}/host/payout-setup/callback?refresh=true`,
        return_url: `${frontendUrl}/host/payout-setup/callback?success=true`,
        type: 'account_onboarding',
      };

      // Try to get account to check if it's a cross-border account
      try {
        const account = await this.stripe.accounts.retrieve(user.stripe_account_id);
        const countryCode = account.country?.toUpperCase();
        const crossBorderCountries = ['VN', 'TH', 'ID', 'PH', 'MY'];
        
        // For cross-border countries, try to specify recipient service agreement type in account link
        // Note: This may not be a valid parameter, but worth trying
        if (countryCode && crossBorderCountries.includes(countryCode)) {
          // Service agreement type should be handled automatically by Stripe
          // based on controller parameter used during account creation
        }
      } catch (err) {
        // If account retrieval fails, continue without country check
        console.log('Could not retrieve account for country check:', err);
      }

      const accountLink = await this.stripe.accountLinks.create(accountLinkParams);

      return {
        url: accountLink.url,
        expires_at: accountLink.expires_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting account link: ${error.message}`);
    }
  }

  async verifyStripeAccount(userId: string) {
    try {
      if (!this.stripe) {
        throw new InternalServerErrorException('Stripe is not configured');
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripe_account_id) {
        throw new BadRequestException('Stripe Connect account not found');
      }

      // Retrieve account from Stripe
      const account = await this.stripe.accounts.retrieve(user.stripe_account_id);

      // Check if account is ready for payouts
      const chargesEnabled = account.charges_enabled;
      const payoutsEnabled = account.payouts_enabled;
      const detailsSubmitted = account.details_submitted;

      let status: 'unverified' | 'pending' | 'verified' = 'unverified';
      let payoutEnabled = false;

      if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
        status = 'verified';
        payoutEnabled = true;
      } else if (detailsSubmitted) {
        status = 'pending';
      }

      // Update user status
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          stripe_account_status: status,
          payout_enabled: payoutEnabled,
        },
        { new: true }
      );

      return {
        account_id: account.id,
        status: status,
        payout_enabled: payoutEnabled,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error verifying Stripe account: ${error.message}`);
    }
  }

  async getStripeAccountStatus(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.stripe_account_id) {
        return {
          has_account: false,
          status: 'unverified',
          payout_enabled: false,
        };
      }

      return {
        has_account: true,
        account_id: user.stripe_account_id,
        status: user.stripe_account_status || 'unverified',
        payout_enabled: user.payout_enabled || false,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error getting account status: ${error.message}`);
    }
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

  // Get user analytics (for hosts)
  async getUserAnalytics(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      // For now, return basic stats
      // In real implementation, would query bookings and listings from other collections
      const listingCount = user.role?.listID?.length || 0;
      
      return {
        listingCount: listingCount,
        bookingCount: 0, // Would need to query bookings collection
        totalRevenue: 0, // Would need to query transactions/bookings
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Lỗi khi lấy thống kê: ${error.message}`);
    }
  }

  
}
