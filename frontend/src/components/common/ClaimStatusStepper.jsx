import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, Banknote, ArrowRight, XCircle } from 'lucide-react';

const STEPS = [
    { key: 'DRAFT', label: 'Draft', desc: 'Editable by Employee' },
    { key: 'MANAGER_REVIEW', label: 'Manager Review', desc: 'Data-Scoped Team Check' },
    { key: 'FINANCE_REVIEW', label: 'Finance Queue', desc: 'Atomic Queue Pool' },
    { key: 'FINANCE_PROCESSING', label: 'Auditing', desc: 'Single-Officer Lock' },
    { key: 'APPROVED', label: 'Approved', desc: 'Ready for Payout' },
    { key: 'REIMBURSED', label: 'Reimbursed', desc: 'Funds Disbursed' },
];

export const ClaimStatusBadge = ({ status, size = 'md' }) => {
    const config = {
        DRAFT: {
            bg: 'bg-slate-100 text-slate-700 border-slate-200',
            dot: 'bg-slate-400',
            label: 'Draft'
        },
        SUBMITTED: {
            bg: 'bg-sky-50 text-sky-700 border-sky-200',
            dot: 'bg-sky-500',
            label: 'Submitted'
        },
        MANAGER_REVIEW: {
            bg: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500',
            label: 'Manager Review'
        },
        FINANCE_REVIEW: {
            bg: 'bg-orange-50 text-orange-700 border-orange-200',
            dot: 'bg-orange-500',
            label: 'Finance Queue'
        },
        FINANCE_PROCESSING: {
            bg: 'bg-purple-50 text-purple-700 border-purple-200',
            dot: 'bg-purple-500',
            label: 'Under Audit'
        },
        APPROVED: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
            label: 'Approved'
        },
        REJECTED: {
            bg: 'bg-rose-50 text-rose-700 border-rose-200',
            dot: 'bg-rose-500',
            label: 'Rejected'
        },
        REIMBURSED: {
            bg: 'bg-teal-50 text-teal-700 border-teal-200',
            dot: 'bg-teal-500',
            label: 'Reimbursed'
        }
    };

    const c = config[status] || { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', label: status };
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border ${c.bg} ${sizeClasses} shadow-xs font-medium`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

export const ClaimStatusStepper = ({ currentStatus, rejectionReason }) => {
    if (currentStatus === 'REJECTED') {
        return (
            <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                        <XCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-rose-900">Claim Rejected by Reviewer</h4>
                            <span className="text-xs bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded-md font-medium">Action Required</span>
                        </div>
                        <p className="text-sm text-rose-700 mt-1">
                            {rejectionReason || "No formal reason provided. You may modify expenses and attach revised receipts to resubmit."}
                        </p>
                        <p className="text-xs text-rose-500 mt-2 font-medium">
                            Status resets to Manager Review (or Finance Review if no manager assigned) upon resubmission.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const getStepIndex = (status) => {
        switch (status) {
            case 'DRAFT': return 0;
            case 'MANAGER_REVIEW': return 1;
            case 'FINANCE_REVIEW': return 2;
            case 'FINANCE_PROCESSING': return 3;
            case 'APPROVED': return 4;
            case 'REIMBURSED': return 5;
            default: return 0;
        }
    };

    const activeIdx = getStepIndex(currentStatus);

    return (
        <div className="w-full py-2">
            <div className="relative">
                {/* Connecting track */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                <div 
                    className="absolute top-4 left-6 h-0.5 bg-indigo-600 transition-all duration-500 -z-0" 
                    style={{ width: `${Math.min(100, (activeIdx / (STEPS.length - 1)) * 100)}%` }}
                />

                <div className="grid grid-cols-6 relative z-10">
                    {STEPS.map((step, idx) => {
                        const isDone = idx < activeIdx;
                        const isCurrent = idx === activeIdx;

                        return (
                            <div key={step.key} className="flex flex-col items-center text-center px-1">
                                <div 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        isDone 
                                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-50' 
                                            : isCurrent 
                                                ? 'bg-white text-indigo-600 ring-4 ring-indigo-100 border-2 border-indigo-600 font-extrabold scale-110' 
                                                : 'bg-white text-slate-400 border border-slate-300'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    ) : (
                                        <span>{idx + 1}</span>
                                    )}
                                </div>
                                <span className={`text-xs mt-2 font-semibold ${isCurrent ? 'text-indigo-900 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {step.label}
                                </span>
                                <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5 leading-tight">
                                    {step.desc}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ClaimStatusStepper;
