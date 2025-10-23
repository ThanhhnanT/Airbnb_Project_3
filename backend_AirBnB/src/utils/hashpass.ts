import bcrypt from 'bcrypt'

const saltRound = 10

export const hashPassword = async (plainPassword : string) => {
    try {
        console.log('utils/hashpass ',plainPassword)
        return await bcrypt.hash(plainPassword, saltRound)
    } catch(e){
        return e
    }
}

export const comparePass = async (password: string, hashpass: string) => {
    try {
        return await bcrypt.compare(password, hashpass)

    } catch(e)  {
        return e
    }
}