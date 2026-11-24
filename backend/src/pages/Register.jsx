import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { User, Lock, Mail, Building, AlertCircle, Shield, Check, Loader2, ArrowRight } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', department: 'Engineering' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Email may already be in use.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 z-10">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
                    <Shield className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Employee Account</h2>
                <p className="text-xs text-slate-400">Join the Sentinel corporate reimbursement network</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Jordan Miller"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Corporate Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. j.miller@sentinel.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Department
                            </label>
                            <div className="relative">
                                <Building className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Engineering, Sales, Product"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-500">
                            🔒 Security policy: All self-registered users are assigned <strong>Role = EMPLOYEE</strong>. Manager assignments and administrative rights are granted via Superadmin governance.
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Registering Account...</span>
                                </>
                            ) : (
                                <span>Create Employee Account</span>
                            )}
                        </button>
                    </form>

                    <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                        <span>Already have an account?</span>
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
