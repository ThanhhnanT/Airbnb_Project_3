
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePass } from '@/utils/hashpass';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService : JwtService
  
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await comparePass(pass, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    return user;
  }


  async signIn(id: string, email: string): Promise<object> {
    console.log(id, email)
    const payload = {sud: id, email: email} 
    const access_token = await this.jwtService.signAsync(payload)
    return {
      access_token: access_token,
      id: id,
      email: email
    };
  }

  register = async ( createUser : CreateAuthDto) => 
  {return this.usersService.hanldeRegister(createUser)}
}
