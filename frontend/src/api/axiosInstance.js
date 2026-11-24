import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend-d9tz.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required for HttpOnly refresh cookie
});

let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

export const getApiBaseUrl = () => API_BASE_URL;

// Request Interceptor: attach Bearer token to outgoing requests
api.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Concurrency queue for token refresh to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: silent refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (!originalRequest) {
            return Promise.reject(error);
        }

        const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') || 
                               originalRequest.url?.includes('/auth/login') ||
                               originalRequest.url?.includes('/auth/register');

        if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                // Queue concurrent requests while refresh is happening
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.accessToken || res.data.Authorization;
                setAccessToken(newAccessToken);
                processQueue(null, newAccessToken);
                
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                setAccessToken(null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
