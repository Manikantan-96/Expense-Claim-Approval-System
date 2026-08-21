import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { User, Lock, Mail, Building, AlertCircle } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', department: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', formData);
            // On success, redirect to login so they can authenticate
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Create Account</h2>
                <p className="mt-2 text-center text-sm text-gray-600">Register as a new employee</p>

                {error && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                        <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <input required type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <input required type="email" placeholder="Email address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <input required type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div className="relative">
                        <Building className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                        <input required type="text" placeholder="Department (e.g. Engineering)" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <div className="mt-4 text-center text-sm">
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;