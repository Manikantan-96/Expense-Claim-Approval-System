import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Shield, 
    LogOut, 
    User as UserIcon, 
    FileText, 
    CheckSquare, 
    CreditCard, 
    Sparkles, 
    PlusCircle,
    Building2,
    Layers
} from 'lucide-react';
import ArchitectureModal from './ArchitectureModal';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isArchModalOpen, setIsArchModalOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) => `
        px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5
        ${isActive(path) 
            ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100/80 font-bold' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}
    `;

    return (
        <>
            <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Logo & Navigation */}
                        <div className="flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2.5 group">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                                        Sentinel<span className="text-indigo-600">Expense</span>
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                                        Enterprise Cloud
                                    </span>
                                </div>
                            </Link>

                            {/* Role-Specific Navigation Links */}
                            <div className="hidden md:flex items-center gap-1">
                                {(user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && (
                                    <Link to="/employee" className={navLinkClass('/employee')}>
                                        <FileText className="h-4 w-4" />
                                        My Claims
                                    </Link>
                                )}

                                {user?.role === 'MANAGER' && (
                                    <Link to="/manager" className={navLinkClass('/manager')}>
                                        <CheckSquare className="h-4 w-4 text-indigo-500" />
                                        Team Review Queue
                                    </Link>
                                )}

                                {user?.role === 'FINANCE_ADMIN' && (
                                    <>
                                        <Link to="/finance" className={navLinkClass('/finance')}>
                                            <CreditCard className="h-4 w-4 text-purple-500" />
                                            Finance Audit Queue
                                        </Link>
                                        <Link to="/admin" className={navLinkClass('/admin')}>
                                            <Building2 className="h-4 w-4 text-slate-500" />
                                            Org Hierarchy
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: Actions, Architecture Tour, Profile */}
                        <div className="flex items-center gap-3">
                            {/* Quick Submit Button for Employees/Managers */}
                            {(user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && (
                                <Link 
                                    to="/employee/new"
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                                >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>New Claim</span>
                                </Link>
                            )}

                            {/* System Architecture Button */}
                            <button
                                onClick={() => setIsArchModalOpen(true)}
                                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                                title="Inspect Concurrency & Auth Architecture"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                <span>Architecture</span>
                            </button>

                            {/* User Profile Capsule */}
                            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                        {user?.sub?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                                            {user?.sub?.split('@')[0]}
                                        </span>
                                        <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wider">
                                            {user?.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <ArchitectureModal 
                isOpen={isArchModalOpen} 
                onClose={() => setIsArchModalOpen(false)} 
            />
        </>
    );
};

export default Navbar;
