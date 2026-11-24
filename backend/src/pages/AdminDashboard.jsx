import React, { useState } from 'react';
import { adminApi } from '../api/adminApi';
import { 
    Shield, 
    UserPlus, 
    AlertCircle, 
    CheckCircle, 
    Users, 
    GitCommit, 
    ArrowRight, 
    UserCheck, 
    Sparkles, 
    Loader2,
    Crown,
    Briefcase
} from 'lucide-react';

const SEED_USERS = [
    {
        id: 1,
        name: 'Marcus Vance',
        email: 'finance@sentinel.com',
        role: 'FINANCE_ADMIN',
        department: 'Treasury & Governance',
        manager: 'None (Root Administrator)'
    },
    {
        id: 2,
        name: 'Sarah Chen',
        email: 'manager@sentinel.com',
        role: 'MANAGER',
        department: 'Engineering',
        manager: 'None (Department Head)'
    },
    {
        id: 3,
        name: 'Alex Rivera',
        email: 'employee@sentinel.com',
        role: 'EMPLOYEE',
        department: 'Engineering',
        manager: 'Sarah Chen (Manager)'
    }
];

const AdminDashboard = () => {
    const [userId, setUserId] = useState('3');
    const [managerId, setManagerId] = useState('2');
    const [role, setRole] = useState('MANAGER');
    
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleAssignManager = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            await adminApi.assignManager(userId, managerId);
            setStatus({ 
                type: 'success', 
                message: `Successfully linked Manager (ID: ${managerId}) to Employee (ID: ${userId}). Claims submitted by this user will now enforce data-scoped manager reviews.` 
            });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.error || 'Failed to assign manager. Ensure target manager has Role=MANAGER and is not self.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSetRole = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            await adminApi.setRole(userId, role);
            setStatus({ 
                type: 'success', 
                message: `Successfully updated User ID ${userId} role to ${role}. Authorization permissions updated dynamically.` 
            });
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.error || 'Failed to update user role.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 text-left">
            {/* Header */}
            <div className="border-b border-slate-200/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
                            <Shield className="h-6 w-6 mr-2 text-indigo-600" />
                            Organization Hierarchy & Governance
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Superadmin
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure direct-reporting lines and role-based permissions that drive data-scoped claim validation.
                    </p>
                </div>
            </div>

            {/* Status Alert Banner */}
            {status.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-xs border ${
                    status.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                    {status.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                    <span className="font-semibold">{status.message}</span>
                </div>
            )}

            {/* Recruiter Cheat-Sheet: Known Seed Directory */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                            Pre-Seeded Corporate Directory (Click to Auto-Fill)
                        </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Click a card to auto-select target ID</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SEED_USERS.map((u) => (
                        <div 
                            key={u.id}
                            onClick={() => setUserId(String(u.id))}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                                userId === String(u.id)
                                    ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-200'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-600">
                                    ID: {u.id}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                            
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                                <span className="font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                                    {u.role}
                                </span>
                                <span className="text-slate-500 truncate max-w-[120px]">
                                    Mgr: {u.manager.split(' ')[0]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Reporting Line Assignment */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <UserPlus className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Establish Reporting Line</h2>
                            <p className="text-[11px] text-slate-500">Link an employee to their direct manager</p>
                        </div>
                    </div>

                    <form onSubmit={handleAssignManager} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                Employee (Target User ID)
                            </label>
                            <input 
                                type="number" 
                                required 
                                value={userId} 
                                onChange={(e) => setUserId(e.target.value)} 
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                placeholder="e.g. 3" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                Direct Manager (Manager ID)
                            </label>
                            <input 
                                type="number" 
                                required 
                                value={managerId} 
                                onChange={(e) => setManagerId(e.target.value)} 
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                placeholder="e.g. 2" 
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Target user must possess Role = MANAGER. Self-assignment is prohibited.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !userId || !managerId} 
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCommit className="h-4 w-4" />}
                            Update Reporting Hierarchy
                        </button>
                    </form>
                </div>

                {/* 2. Role Transition */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Modify Security Role</h2>
                            <p className="text-[11px] text-slate-500">Promote or alter functional authorities</p>
                        </div>
                    </div>

                    <form onSubmit={handleSetRole} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                Target User ID
                            </label>
                            <input 
                                type="number" 
                                required 
                                value={userId} 
                                onChange={(e) => setUserId(e.target.value)} 
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                placeholder="e.g. 3" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                                Designated Security Role
                            </label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)} 
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="EMPLOYEE">EMPLOYEE (Submit & Track Claims)</option>
                                <option value="MANAGER">MANAGER (Review Direct Reports)</option>
                                <option value="FINANCE_ADMIN">FINANCE_ADMIN (Audit Pool & Disburse)</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !userId} 
                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                            Apply Security Role
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
