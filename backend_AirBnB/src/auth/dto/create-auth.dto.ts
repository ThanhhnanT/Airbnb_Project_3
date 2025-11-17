import { IsNotEmpty, IsEmail, MinLength, Matches, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAuthDto {
    @ApiProperty({example: "test_name"})
    @IsNotEmpty({ message: 'Tên không được để trống' })
    @IsString({ message: 'Tên phải là chuỗi ký tự' })
    @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
    @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
    name: string;

    @ApiProperty({example: 'test5@gmail.com'})
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({example: '123456'})
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @MaxLength(50, { message: 'Mật khẩu không được vượt quá 50 ký tự' })
    password: string;

    @ApiProperty({example: '3123012'})
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^[0-9]{10,11}$/, { message: 'Số điện thoại phải có 10-11 chữ số' })
    phone: string;
}
