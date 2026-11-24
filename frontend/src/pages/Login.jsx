import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Shield, 
    Lock, 
    Mail, 
    AlertCircle, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    Users, 
    Cpu, 
    Loader2 
} from 'lucide-react';
import ArchitectureModal from '../components/common/ArchitectureModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isArchModalOpen, setIsArchModalOpen] = useState(false);
    
    const { login, demoPersonas, switchPersona, isSwitchingPersona } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials. If using Render free tier, the database may take ~45s to wake up.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoQuickLogin = async (personaKey) => {
        setError('');
        try {
            await switchPersona(personaKey);
            navigate('/');
        } catch (err) {
            setError('Failed to auto-sign-in demo persona. Please ensure backend is awake.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3 z-10">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Portfolio Production Showcase</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
                    <span className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Shield className="h-6 w-6" />
                    </span>
                    Sentinel<span className="text-indigo-400">Expense</span>
                </h1>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Full-Stack Expense Platform with real Data-Scoped Authorization, Atomic Concurrency Queue, and Private File Streaming.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 space-y-6">
                {/* 1-Click Persona Quick-Access Panel for HR / Recruiters */}
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-indigo-500/20 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-400" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                1-Click Recruiter Fast-Track
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsArchModalOpen(true)}
                            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                            <Cpu className="h-3.5 w-3.5" />
                            System Highlights
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {demoPersonas.map((persona) => (
                            <button
                                key={persona.key}
                                type="button"
                                onClick={() => handleDemoQuickLogin(persona.key)}
                                disabled={isSwitchingPersona || isLoading}
                                className="p-3 rounded-xl bg-slate-900/60 hover:bg-indigo-950/40 border border-slate-700/80 hover:border-indigo-500/40 text-left transition-all duration-150 group flex flex-col justify-between space-y-2 disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                                        {persona.label}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-300 font-medium">{persona.name}</p>
                                    <p className="text-[10px] text-slate-500">{persona.department}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Standard Login Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-base font-bold text-slate-900">Sign in with credentials</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Use your enterprise email or demo credentials</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                Work Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. employee@sentinel.com"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSwitchingPersona}
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {(isLoading || isSwitchingPersona) ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <span>Sign In to Dashboard</span>
                            )}
                        </button>
                    </form>

                    <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                        <span>New to the organization?</span>
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                            Register an employee account
                        </Link>
                    </div>
                </div>
            </div>

            <ArchitectureModal 
                isOpen={isArchModalOpen} 
                onClose={() => setIsArchModalOpen(false)} 
            />
        </div>
    );
};

export default Login;
