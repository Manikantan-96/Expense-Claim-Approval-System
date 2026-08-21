import React, { useEffect, useState } from 'react';
import { claimApi } from '../api/claimApi';
import { Check, X, FileText, AlertCircle, Loader2, Hand, IndianRupee } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
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

const FinanceDashboard = () => {
    // We default to the shared queue
    const [activeTab, setActiveTab] = useState('FINANCE_REVIEW');
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

    const fetchQueue = async (status) => {
        setLoading(true);
        try {
            // The Spring Boot backend returns a Page<ClaimResponse>, so the data array is inside '.content'
            const response = await claimApi.getFinanceQueue(status, 0, 50);
            setClaims(response.data.content);
        } catch (error) {
            console.error('Failed to fetch finance queue', error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch whenever the tab changes
    useEffect(() => {
        fetchQueue(activeTab);
    }, [activeTab]);

    const openReviewModal = async (claim) => {
        setSelectedClaim(claim);
        setShowRejectInput(false);
        setRejectReason('');
        setError('');
        setReceiptUrl(null);
        
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
        if (receiptUrl) URL.revokeObjectURL(receiptUrl);
    };

    // --- State Machine Actions ---

    const handleTake = async () => {
        setActionLoading(true);
        setError('');
        try {
            await claimApi.takeClaim(selectedClaim.id);
            closeReviewModal();
            // Switch to the processing tab to immediately show their taken claim
            setActiveTab('FINANCE_PROCESSING');
        } catch (err) {
            // If another admin took it first, backend throws 409 Conflict
            setError(err.response?.data?.error || 'Failed to take claim. It may have been taken by another admin.');
            // Refresh the queue so the taken claim disappears from their screen
            fetchQueue(activeTab); 
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await claimApi.financeApprove(selectedClaim.id);
            await fetchQueue(activeTab);
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
            setError('A rejection reason is required.');
            return;
        }

        setActionLoading(true);
        try {
            await claimApi.financeReject(selectedClaim.id, rejectReason);
            await fetchQueue(activeTab);
            closeReviewModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject claim.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReimburse = async () => {
        setActionLoading(true);
        try {
            await claimApi.reimburseClaim(selectedClaim.id);
            await fetchQueue(activeTab);
            closeReviewModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reimburse claim.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Finance Processing</h1>
                <p className="text-sm text-gray-500 mt-1">Manage the global expense queue and process reimbursements</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['FINANCE_REVIEW', 'FINANCE_PROCESSING', 'APPROVED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveTab(status)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === status
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {status === 'FINANCE_REVIEW' ? 'Shared Queue' : 
                             status === 'FINANCE_PROCESSING' ? 'My Processing' : 'Pending Reimbursement'}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Data Table */}
            <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                                </td>
                            </tr>
                        ) : claims.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                    No claims found in this queue.
                                </td>
                            </tr>
                        ) : (
                            claims.map((claim) => (
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
                                            {activeTab === 'FINANCE_REVIEW' ? 'Take Claim' : 'Process'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeReviewModal}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        
                       <div className="relative z-10 inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900">
                                            Process Claim
                                        </h3>
                                        <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                                            
                                            {/* Details Grid */}
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

                                            {/* Error Message specifically mapped to backend exceptions */}
                                            {error && (
                                                <div className="bg-red-50 p-3 rounded flex items-center text-sm text-red-700">
                                                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
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
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 text-sm"
                                                        placeholder="State the policy violation..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Action Buttons based on Claim Status */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-t border-gray-200">
                                <button type="button" onClick={closeReviewModal} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                    Close
                                </button>
                                
                                <div className="flex space-x-3">
                                    {selectedClaim.status === 'FINANCE_REVIEW' && (
                                        <button 
                                            onClick={handleTake}
                                            disabled={actionLoading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Hand className="h-4 w-4 mr-2"/>}
                                            Take Claim
                                        </button>
                                    )}

                                    {selectedClaim.status === 'FINANCE_PROCESSING' && (
                                        <>
                                            <button 
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                                            >
                                                {actionLoading && showRejectInput ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <X className="h-4 w-4 mr-2"/>}
                                                {showRejectInput ? 'Confirm Rejection' : 'Reject'}
                                            </button>
                                            {!showRejectInput && (
                                                <button 
                                                    onClick={handleApprove}
                                                    disabled={actionLoading}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Check className="h-4 w-4 mr-2"/>}
                                                    Approve
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {selectedClaim.status === 'APPROVED' && (
                                        <button 
                                            onClick={handleReimburse}
                                            disabled={actionLoading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <IndianRupee className="h-4 w-4 mr-2"/>}
                                            Mark Reimbursed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceDashboard;