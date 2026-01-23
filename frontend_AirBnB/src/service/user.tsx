import axios from "axios";
import Cookies from "js-cookie";

const API_DOMAIN = process.env.API || 'http://localhost:9000/';

// Chỉ dùng access_token cho các API liên quan đến user profile
const getUserTokenHeader = () => {
  const token = Cookies.get('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUserProfile = async () => {
  try {
    const tokenHeader = getUserTokenHeader();
    const result = await axios.get(API_DOMAIN + 'auth/profile', {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...tokenHeader,
      },
    });
    return result.data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: {
  name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}) => {
  try {
    const tokenHeader = getUserTokenHeader();
    const result = await axios.patch(API_DOMAIN + `users/${userId}`, data, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...tokenHeader,
      },
    });
    return result.data;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.response) {
      throw new Error(error.response.data?.message || 'Không thể cập nhật thông tin');
    }
    throw error;
  }
};
