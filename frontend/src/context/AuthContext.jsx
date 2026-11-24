import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../api/axiosInstance';

const AuthContext = createContext();

// Helper to decode JWT payload safely
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

export const DEMO_PERSONAS = [
    {
        key: 'employee',
        role: 'EMPLOYEE',
        label: 'Employee',
        name: 'Alex Rivera',
        title: 'Senior Software Engineer',
        email: 'employee@sentinel.com',
        primaryPassword: 'admin123',
        fallbackPassword: 'BlueSky@2026',
        department: 'Engineering',
        description: 'Creates expense claims, uploads receipts, submits to direct manager.',
        avatarColor: 'bg-emerald-500'
    },
    {
        key: 'manager',
        role: 'MANAGER',
        label: 'Manager',
        name: 'Sarah Chen',
        title: 'Engineering Director',
        email: 'manager@sentinel.com',
        primaryPassword: 'admin123',
        fallbackPassword: 'BlueSky@2026',
        department: 'Engineering',
        description: 'Enforces data-scoped authorization; only reviews direct team members.',
        avatarColor: 'bg-indigo-500'
    },
    {
        key: 'finance',
        role: 'FINANCE_ADMIN',
        label: 'Finance Admin',
        name: 'Marcus Vance',
        title: 'Corporate Treasury Lead',
        email: 'finance@sentinel.com',
        primaryPassword: 'admin123',
        fallbackPassword: 'BlueSky@2026',
        department: 'Finance & Treasury',
        description: 'Operates atomic FIFO queue, takes claims concurrently, disburses reimbursement.',
        avatarColor: 'bg-purple-500'
    }
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

    // Silent initialization on app load
    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await api.post('/auth/refresh');
                const token = res.data.accessToken;
                
                setAccessToken(token);
                setUser(parseJwt(token));
            } catch (error) {
                setAccessToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // Login Action
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const token = res.data.accessToken;
        setAccessToken(token);
        const decoded = parseJwt(token);
        setUser(decoded);
        return decoded;
    };

    // Fast-track demo persona switcher (with automatic fallback password trial)
    const switchPersona = async (personaKey) => {
        const persona = DEMO_PERSONAS.find(p => p.key === personaKey);
        if (!persona) return;

        setIsSwitchingPersona(true);
        try {
            try {
                await login(persona.email, persona.primaryPassword);
            } catch (err) {
                // If primary password fails, attempt fallback
                await login(persona.email, persona.fallbackPassword);
            }
            return true;
        } catch (err) {
            console.error("Demo persona switch failed", err);
            throw err;
        } finally {
            setIsSwitchingPersona(false);
        }
    };

    // Logout Action
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout failed on server, clearing client state anyway", error);
        } finally {
            setAccessToken(null);
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading, 
            switchPersona, 
            isSwitchingPersona,
            demoPersonas: DEMO_PERSONAS 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
