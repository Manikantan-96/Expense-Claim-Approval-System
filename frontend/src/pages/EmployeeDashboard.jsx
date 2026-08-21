import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { claimApi } from '../api/claimApi';
import { Plus } from 'lucide-react';



const StatusBadge = ({ status }) => {
    const styles = {
        DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
        SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
        MANAGER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        FINANCE_REVIEW: 'bg-orange-50 text-orange-700 border-orange-200',
        FINANCE_PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200',
        APPROVED: 'bg-green-50 text-green-700 border-green-200',
        REJECTED: 'bg-red-50 text-red-700 border-red-200',
        REIMBURSED: 'bg-teal-50 text-teal-700 border-teal-200'
    };
    
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[status] || 'bg-gray-100'}`}>
            {status?.replace('_', ' ') || 'UNKNOWN'}
        </span>
    );
};

const EmployeeDashboard = () => {
    const navigate = useNavigate(); // Initialize hook
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const response = await claimApi.getMyClaims();
                setClaims(response.data);
            } catch (error) {
                console.error('Failed to fetch claims', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Expense Claims</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track your expense reimbursements</p>
                </div>
                <button 
                    onClick={() => navigate('/employee/new')} 
                    className="flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Claim
                </button>
            </div>

            <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {claims.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    No claims found. Click 'New Claim' to get started.
                                </td>
                            </tr>
                        ) : (
                            claims.map((claim) => (
                                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {claim.expenseDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {claim.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹{claim.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={claim.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           {(claim.status === 'DRAFT' || claim.status === 'REJECTED') ? (
                   <button 
            onClick={() => navigate(`/employee/edit/${claim.id}`)}
            className="text-blue-600 hover:text-blue-900 font-semibold"
        >
            Edit & Resubmit
        </button>
    ) : (
        <span className="text-gray-400">Locked</span>
    )}
</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeDashboard;