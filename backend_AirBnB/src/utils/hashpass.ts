import bcrypt from 'bcrypt'
import { InternalServerErrorException } from '@nestjs/common'

const saltRound = 10

export const hashPassword = async (plainPassword : string): Promise<string> => {
    try {
        if (!plainPassword || typeof plainPassword !== 'string') {
            throw new Error('Mật khẩu không hợp lệ')
        }
        return await bcrypt.hash(plainPassword, saltRound)
    } catch(error) {
        throw new InternalServerErrorException(`Lỗi khi mã hóa mật khẩu: ${error.message}`)
    }
}

export const comparePass = async (password: string, hashpass: string): Promise<boolean> => {
    try {
        if (!password || !hashpass) {
            return false
        }
        return await bcrypt.compare(password, hashpass)
    } catch(error) {
        throw new InternalServerErrorException(`Lỗi khi so sánh mật khẩu: ${error.message}`)
    }
}