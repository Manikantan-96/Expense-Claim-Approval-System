import axios from 'axios';

const api=axios.create({
    baseURL:'https://backend-d9tz.onrender.com',
    withCredentials:true,// for Httponly refresh token
});

let accessToken=null;

export const setAccessToken=(token)=>{
    accessToken=token;
};
export const getAccessToken=()=>accessToken;

//Interseptor: attach the token for everyoutgoing request
api.interceptors.request.use(
    (config)=>{
        if(accessToken){
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error)=>Promise.reject(error)
);
//interseptor for 403 error and get new access token by using refresh token
// Inside src/api/axiosInstance.js

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // 1. DO NOT retry if the request was to /auth/refresh or /auth/login
        const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') || 
                               originalRequest.url?.includes('/auth/login');

        // 2. Only attempt refresh once on protected API 401s
        if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
                // Use vanilla axios (not 'api') to prevent interceptor recursion
                const res = await axios.post(
                    'https://backend-d9tz.onrender.com/auth/refresh', 
                    {}, 
                    { withCredentials: true }
                );
                
                const newAccessToken = res.data.accessToken || res.data.Authorization;
                setAccessToken(newAccessToken);
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                
                return api(originalRequest);
            } catch (refreshError) {
                setAccessToken(null);
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);
export default api;