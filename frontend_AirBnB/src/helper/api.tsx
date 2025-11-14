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
      console.log('API Error:', error.response?.data || error.message);
      return error.response?.data; 
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};


export const patch = async (path: String, data: object) => {
    try{
        const res = await axios.patch(API_DOMAIN +path, data, config)
        return res
    } catch (e) {
        return e; 
    }
}

export const deleteData = async (path: String) => {
    try{
        const res = await axios.delete(API_DOMAIN + path)
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



const getTokenHeader = () => {
  const token = Cookies.get('access_token'); 
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAccess = async (path: string, params: object = {}) => {
  try {
    const tokenHeader = await getTokenHeader();
    const result = await axios.get(API_DOMAIN + path, {
      ...config,
      headers: { ...config.headers, ...tokenHeader },
      params, 
    });
    return result.data;
  } catch (e) {
    console.error(e);
  }
};


export const postAccess = async (path: string, data: object) => {
  try {
    const tokenHeader = await getTokenHeader();
    const res = await axios.post(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error) {
    console.log('API Error:', error);
    throw error;
  }
};