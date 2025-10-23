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

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) 
  private userModel: Model<User>) {}
  
 isEmailExist = async (email:string) => {
  const user = await this.userModel.exists({email:email})
  if(user) return true
  return false
}

 async create(createUserDto: CreateUserDto) {
    
    const {email, password, phone} = createUserDto
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    
    const newUser = await this.userModel.create({
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
    return await this.userModel.findOne({email: email})
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


  hanldeRegister = async (createUser : CreateAuthDto) => {
     const {email, password} = createUser
    const isExist = await this.isEmailExist(email)

    if(isExist){
      throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác `)
    }

    const hashPass = await hashPassword(password)
    // console.log(hashPass)
    
    const newUser = await this.userModel.create({
      email: email,
      password: hashPass,
      isActive: false,
      codeId: uuidv4(),
      codeExpired: dayjs().add(1, 'day')
    })

    return {
      newUser
    }
  }
}
