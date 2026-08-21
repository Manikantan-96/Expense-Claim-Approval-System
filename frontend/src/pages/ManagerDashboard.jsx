import React, { useEffect, useState } from 'react';
import { claimApi } from '../api/claimApi';
import { Check, X, FileText, AlertCircle, Loader2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        DRAFT: 'bg-gray-100 text-gray-800',
        SUBMITTED: 'bg-blue-50 text-blue-700',
        MANAGER_REVIEW: 'bg-yellow-50 text-yellow-700',
        FINANCE_REVIEW: 'bg-orange-50 text-orange-700',
        FINANCE_PROCESSING: 'bg-purple-50 text-purple-700',
        APPROVED: 'bg-green-50 text-green-700',
        REJECTED: 'bg-red-50 text-red-700',
        REIMBURSED: 'bg-teal-50 text-teal-700'
    };
    return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[status] || 'bg-gray-100'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const ManagerDashboard = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(false);
    
    // Action State
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState('');

    const fetchTeamClaims = async () => {
        setLoading(true);
        try {
            const response = await claimApi.getTeamClaims();
            setClaims(response.data);
        } catch (error) {
            console.error('Failed to fetch team claims', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamClaims();
    }, []);

    const openReviewModal = async (claim) => {
        setSelectedClaim(claim);
        setShowRejectInput(false);
        setRejectReason('');
        setError('');
        setReceiptUrl(null);
        
        // Fetch the private receipt securely
        setReceiptLoading(true);
        try {
            const url = await claimApi.downloadReceipt(claim.id);
            setReceiptUrl(url);
        } catch (err) {
            console.error("Could not load receipt", err);
        } finally {
            setReceiptLoading(false);
        }
    };

    const closeReviewModal = () => {
        setSelectedClaim(null);
        if (receiptUrl) {
            URL.revokeObjectURL(receiptUrl); // Clean up memory
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await claimApi.managerApprove(selectedClaim.id);
            await fetchTeamClaims();
            closeReviewModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve claim.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!showRejectInput) {
            setShowRejectInput(true);
            return;
        }
        if (!rejectReason.trim()) {
            setError('A rejection reason is required by company policy.');
            return;
        }

        setActionLoading(true);
        try {
            await claimApi.managerReject(selectedClaim.id, rejectReason);
            await fetchTeamClaims();
            closeReviewModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject claim.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Filter to show claims requiring attention first
    const sortedClaims = [...claims].sort((a, b) => {
        if (a.status === 'MANAGER_REVIEW' && b.status !== 'MANAGER_REVIEW') return -1;
        if (a.status !== 'MANAGER_REVIEW' && b.status === 'MANAGER_REVIEW') return 1;
        return 0;
    });

    return (
        <div className="space-y-6 relative">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Claims Review</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and approve expenses for your direct reports</p>
            </div>

            <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {sortedClaims.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    No team claims found.
                                </td>
                            </tr>
                        ) : (
                            sortedClaims.map((claim) => (
                                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{claim.expenseDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{claim.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{claim.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={claim.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => openReviewModal(claim)}
                                            className="text-blue-600 hover:text-blue-900 font-semibold"
                                        >
                                            {claim.status === 'MANAGER_REVIEW' ? 'Review Now' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeReviewModal}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        
                       <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            Claim Details
                                        </h3>
                                        <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
                                                    <p className="font-medium text-gray-900">{selectedClaim.category}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                                                    <p className="font-medium text-gray-900">₹{selectedClaim.amount.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                                                    <p className="font-medium text-gray-900">{selectedClaim.expenseDate}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                                                    <StatusBadge status={selectedClaim.status} />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
                                                <p className="text-sm text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                                                    {selectedClaim.description}
                                                </p>
                                            </div>

                                            {/* Receipt Viewer */}
<div>
    <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center">
        <FileText className="h-4 w-4 mr-1"/> Receipt Document
    </p>
    <div className="border-2 border-gray-200 border-dashed rounded-lg p-2 bg-gray-50 min-h-[200px] flex items-center justify-center">
        {receiptLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        ) : receiptUrl ? (
            
            // --- NEW BULLETPROOF VIEWER ---
            <div className="flex flex-col items-center w-full">
                <iframe 
                    src={receiptUrl} 
                    className="w-full h-64 rounded bg-white border border-gray-200" 
                    title="Receipt Document"
                />
                <a 
                    href={receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                >
                    Open document in new tab
                </a>
            </div>
            // ------------------------------

        ) : (
            <span className="text-sm text-gray-500">No receipt available</span>
        )}
    </div>
</div>

                                            {/* Error Message */}
                                            {error && (
                                                <div className="bg-red-50 p-3 rounded flex items-center text-sm text-red-700">
                                                    <AlertCircle className="h-4 w-4 mr-2" />
                                                    {error}
                                                </div>
                                            )}

                                            {/* Rejection Input */}
                                            {showRejectInput && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
                                                    <textarea 
                                                        rows="2"
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                                        placeholder="Explain why this claim violates policy..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-t border-gray-200">
                                <button type="button" onClick={closeReviewModal} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                    Close
                                </button>
                                
                                {selectedClaim.status === 'MANAGER_REVIEW' && (
                                    <div className="flex space-x-3">
                                        <button 
                                            type="button" 
                                            disabled={actionLoading}
                                            onClick={handleReject}
                                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading && showRejectInput ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <X className="h-4 w-4 mr-2"/>}
                                            {showRejectInput ? 'Confirm Rejection' : 'Reject'}
                                        </button>
                                        {!showRejectInput && (
                                            <button 
                                                type="button" 
                                                disabled={actionLoading}
                                                onClick={handleApprove}
                                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                            >
                                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Check className="h-4 w-4 mr-2"/>}
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ManagerDashboard;