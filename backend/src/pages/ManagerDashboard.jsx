import React, { useEffect, useState } from 'react';
import { claimApi } from '../api/claimApi';
import { 
    Check, 
    X, 
    FileText, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    ShieldAlert, 
    Users, 
    ArrowRight, 
    Eye,
    TrendingUp,
    Shield
} from 'lucide-react';
import { ClaimStatusBadge } from '../components/common/ClaimStatusStepper';
import ClaimReviewModal from '../components/common/ClaimReviewModal';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Review State
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTeamClaims = async () => {
        setLoading(true);
        try {
            const response = await claimApi.getTeamClaims();
            setClaims(response.data || []);
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

    const handleApprove = async () => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
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

    const handleReject = async (reason) => {
        if (!selectedClaim) return;
        setActionLoading(true);
        setError('');
        try {
            await claimApi.managerReject(selectedClaim.id, reason);
            await fetchTeamClaims();
            closeReviewModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject claim.');
        } finally {
            setActionLoading(false);
        }
    };

    // Metrics calculations
    const pendingReviewClaims = claims.filter(c => c.status === 'MANAGER_REVIEW');
    const pendingTotal = pendingReviewClaims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const approvedCount = claims.filter(c => ['FINANCE_REVIEW', 'FINANCE_PROCESSING', 'APPROVED', 'REIMBURSED'].includes(c.status)).length;
    const totalTeamExpenses = claims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-xs text-slate-500 font-medium">Verifying team hierarchy & loading claims...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-left">
            {/* Header with Data-Scoping Callout */}
            <div className="border-b border-slate-200/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Expense Queue</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Manager Portal
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Review and approve financial disbursements for your direct reporting engineers.
                    </p>
                </div>

                {/* Educational Security Callout for Recruiters */}
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-4 py-2 flex items-center gap-2.5 text-xs text-indigo-900">
                    <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>
                        <strong>Data-Scoped:</strong> Backend verifies direct manager linkage for every action.
                    </span>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Awaiting Your Approval"
                    value={pendingReviewClaims.length}
                    subtitle={`₹${pendingTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} pending decision`}
                    icon={Clock}
                    color="amber"
                    badge={pendingReviewClaims.length > 0 ? "Action Required" : null}
                />
                <StatCard 
                    title="Approved by You"
                    value={approvedCount}
                    subtitle="Forwarded to Finance review"
                    icon={CheckCircle2}
                    color="emerald"
                />
                <StatCard 
                    title="Total Team Volume"
                    value={`₹${totalTeamExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle={`${claims.length} claims submitted across team`}
                    icon={TrendingUp}
                    color="indigo"
                />
                <StatCard 
                    title="Reporting Team Scope"
                    value="Direct Reports"
                    subtitle="Isolated from other departments"
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Claims Queue */}
            <div className="bg-white shadow-xs rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Team Expense Claims</h3>
                        <p className="text-xs text-slate-500">Only claims from your direct reports appear here</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        {claims.length} Total Records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Claim ID</th>
                                <th className="px-6 py-3.5">Expense Date</th>
                                <th className="px-6 py-3.5">Category & Purpose</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Workflow Status</th>
                                <th className="px-6 py-3.5 text-right">Review Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {claims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                                            <p className="font-semibold text-slate-700">Team Queue Clean!</p>
                                            <p className="text-xs text-slate-400">
                                                No pending claims requiring review from your direct reports.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => {
                                    const isPendingReview = claim.status === 'MANAGER_REVIEW';

                                    return (
                                        <tr key={claim.id} className={`hover:bg-slate-50/80 transition-colors ${isPendingReview ? 'bg-amber-50/20' : ''}`}>
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
                                                        {claim.description || "No description provided"}
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
                                                        isPendingReview
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                    }`}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>{isPendingReview ? 'Review & Decide' : 'Inspect'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review and Approval Modal */}
            <ClaimReviewModal
                isOpen={!!selectedClaim}
                onClose={closeReviewModal}
                claim={selectedClaim}
                receiptUrl={receiptUrl}
                receiptLoading={receiptLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                userRole={user?.role}
                actionLoading={actionLoading}
                error={error}
            />
        </div>
    );
};

export default ManagerDashboard;
