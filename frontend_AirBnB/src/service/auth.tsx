import {get, post} from "@/helper/api"


export const handleLogin = async (data: {
  email: string,
  password: string
}) => {
  const res  = await post('auth/login', data)
  return res
}

export const handleRegister = async (data: object) => {
  const res = await post ('auth/register', data)
  return res 
}

export const handleVerify = async (data: object) => {
  const res = await post ('auth/verify_email', data)
  return res
}