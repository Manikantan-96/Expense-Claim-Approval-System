import React, { useState } from 'react';
import { adminApi } from '../api/adminApi';
import { Shield, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
    const [userId, setUserId] = useState('');
    const [managerId, setManagerId] = useState('');
    const [role, setRole] = useState('MANAGER');
    
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleAssignManager = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            await adminApi.assignManager(userId, managerId);
            setStatus({ type: 'success', message: `Successfully assigned Manager ID ${managerId} to User ID ${userId}.` });
            setManagerId('');
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to assign manager.' });
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
            setStatus({ type: 'success', message: `Successfully updated User ID ${userId} to ${role}.` });
        } catch (error) {
            setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to update role.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="h-6 w-6 mr-2 text-blue-600" />
                    System Administration
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage user roles and reporting hierarchies</p>
            </div>

            {status.message && (
                <div className={`p-4 rounded-lg flex items-center ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {status.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                    <span className="text-sm font-medium">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Assignment Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Update User Role</h2>
                    <form onSubmit={handleSetRole} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                            <input type="number" required value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g., 105" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
                                <option value="EMPLOYEE">Employee</option>
                                <option value="MANAGER">Manager</option>
                                <option value="FINANCE_ADMIN">Finance Admin</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading || !userId} className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            Update Role
                        </button>
                    </form>
                </div>

                {/* Manager Assignment Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-gray-500" />
                        Assign Manager
                    </h2>
                    <form onSubmit={handleAssignManager} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target User ID</label>
                            <input type="number" required value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g., 105" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager (ID)</label>
                            <input type="number" required value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g., 201" />
                        </div>
                        <button type="submit" disabled={loading || !userId || !managerId} className="w-full py-2 px-4 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 disabled:opacity-50 transition-colors">
                            Link Manager
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;