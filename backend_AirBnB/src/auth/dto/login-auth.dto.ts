import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginAuthDto {
    @ApiProperty({example: 'vuongthanhsaovang@gmail.com'})
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: '123456'})
    @IsNotEmpty()
    password: string;


}
