import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsString, Length } from "class-validator";

export class VerifyDto {
    @ApiProperty({example: "vuongthanhsaovang@gmail.com"})
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({example: '12334'})
    @IsNotEmpty({ message: 'Mã xác nhận không được để trống' })
    @IsString({ message: 'Mã xác nhận phải là chuỗi ký tự' })
    @Length(1, 100, { message: 'Mã xác nhận không hợp lệ' })
    codeId: string;
}
