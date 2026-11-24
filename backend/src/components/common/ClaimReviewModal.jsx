import React, { useState } from 'react';
import { X, Check, AlertTriangle, FileText, Download, Calendar, DollarSign, User, Building, Loader2, Sparkles } from 'lucide-react';
import { ClaimStatusBadge, ClaimStatusStepper } from './ClaimStatusStepper';

const REJECTION_PRESETS = [
    "Itemized tax invoice is missing or illegible.",
    "Expense exceeds allowable per-diem policy threshold.",
    "Duplicate submission of an existing reimbursement request.",
    "Expenses outside authorized travel date window."
];

const ClaimReviewModal = ({
    isOpen,
    onClose,
    claim,
    receiptUrl,
    receiptLoading,
    onApprove,
    onReject,
    onTake,
    onReimburse,
    userRole,
    actionLoading,
    error
}) => {
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [localError, setLocalError] = useState('');

    if (!isOpen || !claim) return null;

    const handleConfirmReject = () => {
        if (!rejectReason.trim()) {
            setLocalError('Please provide or select a rejection reason.');
            return;
        }
        setLocalError('');
        onReject(rejectReason);
    };

    const isFinanceAdmin = userRole === 'FINANCE_ADMIN';
    const isManager = userRole === 'MANAGER';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-slate-900">Claim #{claim.id}</h3>
                                <ClaimStatusBadge status={claim.status} />
                            </div>
                            <p className="text-xs text-slate-500">
                                Submitted on {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Draft'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Visual Stepper */}
                    <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4">
                        <ClaimStatusStepper 
                            currentStatus={claim.status} 
                            rejectionReason={claim.rejectionReason} 
                        />
                    </div>

                    {(error || localError) && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-700">
                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                            <span>{error || localError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Claim Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Claim Breakdown</h4>
                            
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Claim Amount</span>
                                    <span className="text-xl font-bold text-slate-900">₹{Number(claim.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Category</span>
                                    <span className="font-semibold text-slate-800">{claim.category}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Expense Date</span>
                                    <span className="font-medium text-slate-700">{claim.expenseDate}</span>
                                </div>
                                <div className="pt-1">
                                    <span className="text-slate-500 block text-xs mb-1">Business Justification:</span>
                                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg text-xs leading-relaxed border border-slate-100">
                                        {claim.description || "No description provided."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Secure Receipt Document Stream */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                <span>Attached Receipt</span>
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">Private Stream</span>
                            </h4>

                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-[220px] flex flex-col items-center justify-center p-4 text-center">
                                {receiptLoading ? (
                                    <div className="space-y-2 flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        <p className="text-xs text-slate-500">Decrypting & streaming receipt from private vault...</p>
                                    </div>
                                ) : receiptUrl ? (
                                    <div className="w-full flex flex-col items-center space-y-3">
                                        {receiptUrl.includes('.pdf') || receiptUrl.startsWith('blob:') ? (
                                            <div className="w-full">
                                                <img 
                                                    src={receiptUrl} 
                                                    alt="Expense Receipt" 
                                                    onError={(e) => {
                                                        // Fallback if it's a PDF rendered via blob
                                                        e.target.style.display = 'none';
                                                    }}
                                                    className="max-h-52 mx-auto rounded-lg shadow-xs border border-slate-200 object-contain"
                                                />
                                                <a 
                                                    href={receiptUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    View Full Resolution Document
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                                                <p className="text-xs text-slate-600 font-medium">Receipt Document Available</p>
                                                <a 
                                                    href={receiptUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold"
                                                >
                                                    Open Document
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 space-y-1">
                                        <FileText className="h-8 w-8 mx-auto opacity-50" />
                                        <p className="text-xs">No receipt attached to this claim</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rejection input area if toggled */}
                    {showRejectInput && (
                        <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Provide Rejection Reason</h4>
                            
                            {/* Preset Buttons */}
                            <div className="flex flex-wrap gap-1.5">
                                {REJECTION_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setRejectReason(preset)}
                                        className="text-[11px] bg-white border border-rose-200 text-rose-800 hover:bg-rose-100/60 px-2.5 py-1 rounded-md text-left transition-colors"
                                    >
                                        + {preset}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Specify exact reason according to corporate reimbursement policy..."
                                className="w-full text-xs p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                                rows="3"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowRejectInput(false)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmReject}
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {actionLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Actions Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Manager Actions */}
                        {isManager && claim.status === 'MANAGER_REVIEW' && !showRejectInput && (
                            <>
                                <button
                                    onClick={() => setShowRejectInput(true)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                                >
                                    Reject Claim
                                </button>
                                <button
                                    onClick={onApprove}
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    Approve for Finance
                                </button>
                            </>
                        )}

                        {/* Finance Review Queue Actions */}
                        {isFinanceAdmin && claim.status === 'FINANCE_REVIEW' && (
                            <button
                                onClick={onTake}
                                disabled={actionLoading}
                                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                Take Claim (Atomic Guard)
                            </button>
                        )}

                        {/* Finance Processing Actions */}
                        {isFinanceAdmin && claim.status === 'FINANCE_PROCESSING' && !showRejectInput && (
                            <>
                                <button
                                    onClick={() => setShowRejectInput(true)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={onApprove}
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    Final Approval
                                </button>
                            </>
                        )}

                        {/* Finance Reimbursement Action */}
                        {isFinanceAdmin && claim.status === 'APPROVED' && (
                            <button
                                onClick={onReimburse}
                                disabled={actionLoading}
                                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Disburse Funds (Reimburse)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimReviewModal;
