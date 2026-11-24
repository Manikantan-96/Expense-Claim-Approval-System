import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimApi } from '../api/claimApi';
import { 
    Plus, 
    FileText, 
    Calendar, 
    DollarSign, 
    Plane, 
    Coffee, 
    Laptop, 
    Tag, 
    Eye, 
    Edit3, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Receipt, 
    Search,
    Filter
} from 'lucide-react';
import { ClaimStatusBadge } from '../components/common/ClaimStatusStepper';
import ClaimReviewModal from '../components/common/ClaimReviewModal';
import StatCard from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

const getCategoryIcon = (category) => {
    switch (category) {
        case 'TRAVEL': return Plane;
        case 'MEALS': return Coffee;
        case 'EQUIPMENT': return Laptop;
        default: return Tag;
    }
};

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state for viewing claim and receipt
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [receiptUrl, setReceiptUrl] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(false);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const response = await claimApi.getMyClaims();
            setClaims(response.data || []);
        } catch (error) {
            console.error('Failed to fetch claims', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const openViewModal = async (claim) => {
        setSelectedClaim(claim);
        setReceiptUrl(null);
        setReceiptLoading(true);
        try {
            const url = await claimApi.downloadReceipt(claim.id);
            setReceiptUrl(url);
        } catch (err) {
            console.error("No receipt or error fetching receipt", err);
        } finally {
            setReceiptLoading(false);
        }
    };

    const closeViewModal = () => {
        setSelectedClaim(null);
        if (receiptUrl) URL.revokeObjectURL(receiptUrl);
        setReceiptUrl(null);
    };

    // Metrics calculations
    const totalClaimed = claims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalReimbursed = claims
        .filter(c => c.status === 'REIMBURSED')
        .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const inReviewCount = claims.filter(c => 
        ['MANAGER_REVIEW', 'FINANCE_REVIEW', 'FINANCE_PROCESSING'].includes(c.status)
    ).length;
    const actionRequiredCount = claims.filter(c => 
        ['REJECTED', 'DRAFT'].includes(c.status)
    ).length;

    // Filter logic
    const filteredClaims = claims.filter((claim) => {
        const matchesSearch = 
            claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(claim.id).includes(searchTerm);

        if (!matchesSearch) return false;

        if (activeTab === 'IN_REVIEW') {
            return ['MANAGER_REVIEW', 'FINANCE_REVIEW', 'FINANCE_PROCESSING'].includes(claim.status);
        }
        if (activeTab === 'APPROVED') {
            return ['APPROVED', 'REIMBURSED'].includes(claim.status);
        }
        if (activeTab === 'REJECTED') {
            return claim.status === 'REJECTED';
        }
        if (activeTab === 'DRAFT') {
            return claim.status === 'DRAFT';
        }
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-xs text-slate-500 font-medium">Loading claims ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-left">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Reimbursements</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Track submissions across manager reviews, finance verification, and payment disbursement.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/employee/new')} 
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create New Claim</span>
                </button>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Expenses"
                    value={`₹${totalClaimed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle={`${claims.length} lifetime claims recorded`}
                    icon={FileText}
                    color="indigo"
                />
                <StatCard 
                    title="Reimbursed"
                    value={`₹${totalReimbursed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    subtitle="Directly deposited into account"
                    icon={CheckCircle2}
                    color="emerald"
                />
                <StatCard 
                    title="Active In Review"
                    value={inReviewCount}
                    subtitle="Manager & finance pipeline"
                    icon={Clock}
                    color="amber"
                />
                <StatCard 
                    title="Action Required"
                    value={actionRequiredCount}
                    subtitle="Drafts or rejected for edits"
                    icon={AlertCircle}
                    color="rose"
                    badge={actionRequiredCount > 0 ? "Requires Attention" : null}
                />
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { key: 'ALL', label: 'All Claims', count: claims.length },
                        { key: 'IN_REVIEW', label: 'In Review', count: inReviewCount },
                        { key: 'APPROVED', label: 'Approved & Settled', count: claims.filter(c => ['APPROVED', 'REIMBURSED'].includes(c.status)).length },
                        { key: 'REJECTED', label: 'Rejected', count: claims.filter(c => c.status === 'REJECTED').length },
                        { key: 'DRAFT', label: 'Drafts', count: claims.filter(c => c.status === 'DRAFT').length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                activeTab === tab.key
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search category, desc, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white shadow-xs rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-3.5">Claim ID</th>
                                <th className="px-6 py-3.5">Date</th>
                                <th className="px-6 py-3.5">Category & Purpose</th>
                                <th className="px-6 py-3.5">Amount</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                                            <p className="font-semibold text-slate-700">No expense claims found</p>
                                            <p className="text-xs text-slate-400">
                                                {searchTerm ? "Try adjusting your search criteria" : "Click 'Create New Claim' to submit an expense."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map((claim) => {
                                    const CategoryIcon = getCategoryIcon(claim.category);
                                    const isEditable = claim.status === 'DRAFT' || claim.status === 'REJECTED';

                                    return (
                                        <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                                                #{claim.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                                                {claim.expenseDate}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                                                        <CategoryIcon className="h-4 w-4" />
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <span className="font-bold text-slate-900 block">
                                                            {claim.category}
                                                        </span>
                                                        <span className="text-slate-500 text-[11px] truncate block">
                                                            {claim.description || "No notes"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 text-sm">
                                                ₹{Number(claim.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <ClaimStatusBadge status={claim.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openViewModal(claim)}
                                                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Inspect Claim & Receipt"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>Inspect</span>
                                                    </button>

                                                    {isEditable && (
                                                        <button
                                                            onClick={() => navigate(`/employee/edit/${claim.id}`)}
                                                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
                                                        >
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                            <span>{claim.status === 'REJECTED' ? 'Fix & Resubmit' : 'Edit'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for viewing claim details & receipt */}
            <ClaimReviewModal
                isOpen={!!selectedClaim}
                onClose={closeViewModal}
                claim={selectedClaim}
                receiptUrl={receiptUrl}
                receiptLoading={receiptLoading}
                userRole={user?.role}
            />
        </div>
    );
};

export default EmployeeDashboard;
