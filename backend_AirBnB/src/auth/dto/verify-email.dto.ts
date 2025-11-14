import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";


export class VerifyDto {
    @ApiProperty({example: "vuongthanhsaovang@gmail.com"})
    @IsNotEmpty()
    email: string;



    @ApiProperty({example: '12334'})
    @IsNotEmpty()
    codeId: string;



}
