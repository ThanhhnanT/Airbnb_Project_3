import axios from 'axios';
import Cookies from "js-cookie";


const API_DOMAIN = process.env.API || 'http://localhost:9000/'
const config = {
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    // withCredentials: true
}
export const get = async (path: String) => {
    try {
        const result = await axios.get(API_DOMAIN + path, { withCredentials: true });
        return result;
    } catch (e){
        if(e) {
            console.log(e)
        }
        else {
            alert("Network connect failed")
        }
    }
}

export const post = async (path: string, data: object) => {
  try {
    console.log(API_DOMAIN + path)
    const res = await axios.post(API_DOMAIN + path, data, config);
    return res.data; 
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Network error
      if (!error.response) {
        console.error('Network Error:', error.message);
        return {
          statusCode: 0,
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.',
          error: 'Network Error'
        };
      }
      
      // Server responded with error
      const errorData = error.response?.data || {};
      const statusCode = error.response?.status || 500;
      const message = errorData.message || errorData.error || 'Đã xảy ra lỗi không xác định';
      
      console.error('API Error:', {
        status: statusCode,
        message: message,
        data: errorData
      });
      
      return {
        statusCode: statusCode,
        message: message,
        error: errorData.error || error.message,
        ...errorData
      };
    } else {
      console.error('Unknown error:', error);
      return {
        statusCode: 500,
        message: 'Đã xảy ra lỗi không xác định',
        error: error.message || 'Unknown error'
      };
    }
  }
};


export const patch = async (path: String, data: object, useAdminToken?: boolean) => {
    try{
        const tokenHeader = getTokenHeader(useAdminToken);
        const res = await axios.patch(API_DOMAIN +path, data, { ...config, headers: { ...config.headers, ...tokenHeader } })
        return res
    } catch (e) {
        return e; 
    }
}

export const deleteData = async (path: String, useAdminToken?: boolean) => {
    try{
        const tokenHeader = getTokenHeader(useAdminToken);
        const res = await axios.delete(API_DOMAIN + path, { ...config, headers: { ...config.headers, ...tokenHeader } })
        return res
    } catch (e) {
        console.log(e)
    }
}




export const upImage = async (path: String, data: object) => {
    try{
        const response = await axios.post(API_DOMAIN + path, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        return response
    } catch(e) {
        console.log(e)
    }
}



const getTokenHeader = (useAdminToken?: boolean) => {
  // Nếu explicitly yêu cầu admin token, chỉ dùng admin_token
  if (useAdminToken === true) {
    const adminToken = Cookies.get('admin_token');
    console.log("[API] getTokenHeader - useAdminToken=true, adminToken:", adminToken ? "Present" : "Missing");
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }

  // Nếu explicitly yêu cầu user token, chỉ dùng access_token
  if (useAdminToken === false) {
    const token = Cookies.get('access_token');
    console.log("[API] getTokenHeader - useAdminToken=false, accessToken:", token ? "Present" : "Missing");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Auto-detect: Kiểm tra pathname để quyết định
  // Nếu đang ở route /admin/* thì dùng admin_token, còn lại dùng access_token
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    console.log("[API] getTokenHeader - pathname:", pathname);
    if (pathname.startsWith('/admin')) {
      const adminToken = Cookies.get('admin_token');
      console.log("[API] getTokenHeader - auto-detect: /admin route, adminToken:", adminToken ? "Present" : "Missing");
      return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
    }
  }

  // Mặc định: dùng access_token cho user thường
  const token = Cookies.get('access_token');
  const adminToken = Cookies.get('admin_token');
  console.log("[API] getTokenHeader - default: accessToken:", token ? "Present" : "Missing", "adminToken:", adminToken ? "Present" : "Missing");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAccess = async (path: string, params: object = {}, useAdminToken?: boolean) => {
  try {
    const tokenHeader = getTokenHeader(useAdminToken);
    console.log("[API] getAccess - path:", path);
    console.log("[API] getAccess - params:", params);
    console.log("[API] getAccess - useAdminToken:", useAdminToken);
    console.log("[API] getAccess - tokenHeader:", tokenHeader ? "Token present" : "No token");
    console.log("[API] getAccess - full URL:", API_DOMAIN + path);
    
    const result = await axios.get(API_DOMAIN + path, {
      ...config,
      headers: { ...config.headers, ...tokenHeader },
      params, 
    });
    
    console.log("[API] getAccess - response status:", result.status);
    console.log("[API] getAccess - response data:", result.data);
    
    return result.data;
  } catch (e: any) {
    // Don't log 404 errors as they are expected for optional endpoints
    if (e?.response?.status !== 404) {
      console.error("[API] getAccess - Error:", e);
      console.error("[API] getAccess - Error response:", e?.response?.data);
      console.error("[API] getAccess - Error status:", e?.response?.status);
    }
    throw e; // Re-throw để frontend có thể handle
  }
};


export const postAccess = async (path: string, data: object, useAdminToken?: boolean) => {
  try {
    const tokenHeader = getTokenHeader(useAdminToken);
    const res = await axios.post(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error) {
    console.log('API Error:', error);
    throw error;
  }
};

export const patchAccess = async (path: string, data: object, useAdminToken?: boolean) => {
  try {
    const tokenHeader = getTokenHeader(useAdminToken);
    const res = await axios.patch(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error) {
    console.log('API Error:', error);
    throw error;
  }
};