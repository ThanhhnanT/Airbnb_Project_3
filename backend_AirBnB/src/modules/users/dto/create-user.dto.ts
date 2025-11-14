import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class CreateUserDto {
    @ApiProperty({example: "test_name"})
    @IsNotEmpty()
    name: string;


    @ApiProperty({example: 'test5@gmail.com'})
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: '123456'})
    @IsNotEmpty()
    password: string;


    @ApiProperty({example: '3123012'})
    @IsNotEmpty()
    phone: string;



}
