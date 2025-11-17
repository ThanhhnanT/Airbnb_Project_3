import { IsNotEmpty, IsEmail, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginAuthDto {
    @ApiProperty({example: 'vuongthanhsaovang@gmail.com'})
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({example: '123456'})
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(1, { message: 'Mật khẩu không được để trống' })
    password: string;
}
