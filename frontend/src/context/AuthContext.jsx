import React,{createContext, useState, useEffect, useContext} from 'react';
import api,{setAccessToken} from '../api/axiosInstance';

const AuthContext=createContext();
// Helper function to decode the JWT payload
const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    // 1. Silent Initialization: Runs once when the React app loads
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Attempt to get a new access token using the browser's HttpOnly cookie
                const res = await api.post('/auth/refresh');
                const token = res.data.accessToken;
                
                setAccessToken(token);
                setUser(parseJwt(token)); // Expecting { sub: "email", role: "ROLE_NAME", ... }
            } catch (error) {
                // No valid session exists. User will remain null.
                setAccessToken(null);
                setUser(null);
            } finally {
                // Stop the loading spinner whether it succeeded or failed
                setLoading(false);
            }
        };
        initAuth();
    }, []);
    //2. login Action
    const login=async (email,password)=>{
        const res=await api.post('/auth/login',{email,password});
        const token=res.data.accessToken;
        setAccessToken(token);
        setUser(parseJwt(token));
    };

    //3. logout Action
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout failed on server, clearing local state anyway", error);
        } finally {
            setAccessToken(null);
            setUser(null);
            window.location.href = '/login';
        }
    };
   return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
// Custom hook to use the Auth context easily in any component
export const useAuth = () => useContext(AuthContext);

