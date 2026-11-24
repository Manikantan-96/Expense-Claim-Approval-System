import React, { useEffect, useState } from 'react';
import { claimApi } from '../api/claimApi';
import { 
    Check, 
    X, 
    FileText, 
    AlertCircle, 
    Loader2, 
    Hand, 
    Banknote, 
    ShieldCheck, 
    Zap, 
    Clock, 
    Eye, 
    Sparkles, 
    DollarSign,
    CheckCircle2
} from 'lucide-react';
import { ClaimStatusBadge } from '../components/common/ClaimStatusStepper';
import ClaimReviewModal from '../components/common/ClaimReviewModal';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

const FinanceDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('FINANCE_REVIEW');
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(false);
    
    // Action State
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchQueue = async (status) => {
        setLoading(true);
        try {
            const response = await claimApi.getFinanceQueue(status, 0, 50);
            // Spring Boot Page response returns list in .content
            setClaims(response.data?.content || []);
        } catch (error) {
            console.error('Failed to fetch finance queue', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue(activeTab);
    }, [activeTab]);

    const openReviewModal = async (claim) => {
        setSelectedClaim(claim);
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
        setReceiptUrl(null);
    };

    // 1. Take Claim (Atomic Concurrency Action)
    const handleTake = async () => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
        try {
            await claimApi.takeClaim(selectedClaim.id);
            closeReviewModal();
            setActiveTab('FINANCE_PROCESSING'); // Switch to their personal processing list
        } catch (err) {
            setError(err.response?.data?.error || 'Conflict: Claim was taken by another finance admin a millisecond ago.');
            fetchQueue(activeTab);
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Final Approval
    const handleApprove = async () => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
        try {
            await claimApi.financeApprove(selectedClaim.id);
            closeReviewModal();
            fetchQueue(activeTab);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve claim.');
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Final Rejection
    const handleReject = async (reason) => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
        try {
            await claimApi.financeReject(selectedClaim.id, reason);
            closeReviewModal();
            fetchQueue(activeTab);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject claim.');
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Reimbursement Disbursal
    const handleReimburse = async () => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
        try {
            await claimApi.reimburseClaim(selectedClaim.id);
            closeReviewModal();
            fetchQueue(activeTab);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to disburse funds.');
        } finally {
            setActionLoading(false);
        }
    };

    const currentTotal = claims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

    return (
        <div className="space-y-6 text-left">
            {/* Header */}
            <div className="border-b border-slate-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Audit & Treasury</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Finance Admin
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Shared concurrency-guarded FIFO queue for auditing receipts and releasing funds.
                    </p>
                </div>

                {/* Concurrency Banner */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
                    <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                        <strong>Atomic Lock Active:</strong> Multiple admins cannot take the same claim.
                    </span>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Current View Total"
                    value={`₹${currentTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle={`${claims.length} claims in active view`}
                    icon={Banknote}
                    color="indigo"
                />
                <StatCard 
                    title="Concurrency Protocol"
                    value="SQL Guarded"
                    subtitle="Row-count affected verification"
                    icon={Zap}
                    color="amber"
                />
                <StatCard 
                    title="Audit Integrity"
                    value="Strict FIFO"
                    subtitle="Ordered by submission timestamp"
                    icon={Clock}
                    color="purple"
                />
                <StatCard 
                    title="Treasury Release"
                    value="Direct Payout"
                    subtitle="Marks ledger status REIMBURSED"
                    icon={CheckCircle2}
                    color="emerald"
                />
            </div>

            {/* Stage Selector Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-2">
                {[
                    { 
                        key: 'FINANCE_REVIEW', 
                        label: '1. Shared Pool Queue', 
                        desc: 'Unassigned claims waiting for an admin to take',
                        color: 'text-orange-700'
                    },
                    { 
                        key: 'FINANCE_PROCESSING', 
                        label: '2. Under Active Audit', 
                        desc: 'Claim locked to your administrative session',
                        color: 'text-purple-700'
                    },
                    { 
                        key: 'APPROVED', 
                        label: '3. Awaiting Disbursement', 
                        desc: 'Approved claims ready for bank reimbursement',
                        color: 'text-emerald-700'
                    },
                    { 
                        key: 'REIMBURSED', 
                        label: '4. Disbursed Archive', 
                        desc: 'Completed and settled reimbursements',
                        color: 'text-teal-700'
                    },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 min-w-[200px] text-left p-3 rounded-xl transition-all border ${
                            activeTab === tab.key
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/70 text-slate-700'
                        }`}
                    >
                        <span className="block text-xs font-bold">{tab.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${activeTab === tab.key ? 'text-slate-300' : 'text-slate-500'}`}>
                            {tab.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Claims Queue Table */}
            <div className="bg-white shadow-xs rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            {activeTab === 'FINANCE_REVIEW' && 'Shared Finance Pool (FIFO Queue)'}
                            {activeTab === 'FINANCE_PROCESSING' && 'Claims Currently Under Audit'}
                            {activeTab === 'APPROVED' && 'Approved Claims Ready for Payout'}
                            {activeTab === 'REIMBURSED' && 'Settled & Disbursed Reimbursements'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {activeTab === 'FINANCE_REVIEW' ? 'Click "Take Claim" to lock claim atomically to your user' : 'Review details or execute financial transactions'}
                        </p>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        {claims.length} Records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Claim ID</th>
                                <th className="px-6 py-3.5">Date</th>
                                <th className="px-6 py-3.5">Category & Purpose</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                                        <span>Fetching database queue...</span>
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                                            <p className="font-semibold text-slate-700">Queue is Clear</p>
                                            <p className="text-xs text-slate-400">
                                                No expense claims found under this status filter.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                                            #{claim.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                            {claim.expenseDate}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <span className="font-bold text-slate-900 block">
                                                    {claim.category}
                                                </span>
                                                <span className="text-slate-500 text-[11px] truncate block">
                                                    {claim.description || "No notes"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 text-sm">
                                            ₹{Number(claim.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ClaimStatusBadge status={claim.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => openReviewModal(claim)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ml-auto ${
                                                    activeTab === 'FINANCE_REVIEW'
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                                        : activeTab === 'FINANCE_PROCESSING'
                                                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                                            : activeTab === 'APPROVED'
                                                                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                }`}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>
                                                    {activeTab === 'FINANCE_REVIEW' && 'Take & Audit'}
                                                    {activeTab === 'FINANCE_PROCESSING' && 'Audit Decision'}
                                                    {activeTab === 'APPROVED' && 'Reimburse Funds'}
                                                    {activeTab === 'REIMBURSED' && 'Inspect Record'}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Claim Review Modal */}
            <ClaimReviewModal
                isOpen={!!selectedClaim}
                onClose={closeReviewModal}
                claim={selectedClaim}
                receiptUrl={receiptUrl}
                receiptLoading={receiptLoading}
                onTake={handleTake}
                onApprove={handleApprove}
                onReject={handleReject}
                onReimburse={handleReimburse}
                userRole={user?.role}
                actionLoading={actionLoading}
                error={error}
            />
        </div>
    );
};

export default FinanceDashboard;
