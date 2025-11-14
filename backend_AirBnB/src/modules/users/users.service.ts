import { BadRequestException, Injectable } from '@nestjs/common';
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
  
 isEmailExist = async (email:string) => {
  const user = await this.userModel.exists({email:email})
  if(user) return true
  return false
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
    return await this.userModel.findOne({email: email}).select('-password')
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


  hanldeRegister = async (createUser : CreateAuthDto) => {
    const {name, email, password, phone} = createUser
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    const codeId = uuidv4()
    const newUser = await this.userModel.create({
      name: name,
      email: email,
      password: hashPass,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(1, 'day')
    })

    await this.mailerService.sendMail({
      to: email,
      subject: 'Active your account',
      text: 'welcome',
      template: 'register',
      context: {
        name: name,
        activationCode: codeId 
      }

    })

    return {
      statusCode: 201,
    }
  }
  
verifyEmail = async (verifyDto: VerifyDto) => {
  const { email, codeId } = verifyDto;

  try {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return {
        statusCode: 404,
        message: 'User not found',
      };
    }

    if (user.codeId !== codeId) {
      return {
        statusCode: 400,
        message: 'Mã xác nhận không đúng',
      };
    }

    await this.userModel.updateOne(
      { email },
      { email_verified: true, codeId: null }
    );

    return {
      statusCode: 200,
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    return {
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
    };
  }
};



  
}
