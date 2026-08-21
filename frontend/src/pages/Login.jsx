import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Info } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to auto-fill credentials for reviewers
    const fillCredentials = (demoEmail, demoPassword) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900">Expense Management System</h2>
                        <p className="mt-2 text-center text-sm text-gray-600">Welcome</p>
                    </div>
                    
                    {error && (
                        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email" required value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit" disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-600">Don't have an account? </span>
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Register here</Link>
                    </div>
                </div>

                {/* Demo Credentials Panel */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-3">
                        <Info className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-sm font-bold text-blue-900">Reviewer Demo Accounts</h3>
                    </div>
                    <div className="space-y-2">
                        <button onClick={() => fillCredentials('finance@sentinel.com', 'BlueSky@2026')} className="w-full text-left px-3 py-2 text-sm bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                            <span className="font-semibold text-gray-900">Finance Admin:</span> finance@sentinel.com
                        </button>
                        <button onClick={() => fillCredentials('manager@sentinel.com', 'BlueSky@2026')} className="w-full text-left px-3 py-2 text-sm bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                            <span className="font-semibold text-gray-900">Manager:</span> manager@sentinel.com
                        </button>
                        <button onClick={() => fillCredentials('employee@sentinel.com', 'BlueSky@2026')} className="w-full text-left px-3 py-2 text-sm bg-white border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                            <span className="font-semibold text-gray-900">Employee:</span> employee@sentinel.com
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;