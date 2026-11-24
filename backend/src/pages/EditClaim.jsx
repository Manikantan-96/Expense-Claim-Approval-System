import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { claimApi } from '../api/claimApi';
import { 
    ArrowLeft, 
    AlertCircle, 
    UploadCloud, 
    Plane, 
    Coffee, 
    Laptop, 
    Tag, 
    FileText, 
    Check, 
    X, 
    Loader2, 
    Calendar,
    XCircle
} from 'lucide-react';
import { ClaimStatusBadge, ClaimStatusStepper } from '../components/common/ClaimStatusStepper';

const CATEGORIES = [
    { key: 'TRAVEL', label: 'Travel & Lodging', icon: Plane },
    { key: 'MEALS', label: 'Client Meals & Dining', icon: Coffee },
    { key: 'EQUIPMENT', label: 'Hardware & Gear', icon: Laptop },
    { key: 'OTHER', label: 'Software & Misc', icon: Tag },
];

const EditClaim = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [claimStatus, setClaimStatus] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [formData, setFormData] = useState({ category: '', amount: '', expenseDate: '', description: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const response = await claimApi.getClaimById(id);
                const data = response.data;
                setFormData({
                    category: data.category,
                    amount: data.amount,
                    expenseDate: data.expenseDate,
                    description: data.description || ''
                });
                setClaimStatus(data.status);
                setRejectionReason(data.rejectionReason);
            } catch (err) {
                setError('Failed to load expense claim details.');
            } finally {
                setLoading(false);
            }
        };
        fetchClaim();
    }, [id]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setReceiptFile(file);
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleAction = async (actionType) => {
        if (!formData.amount || Number(formData.amount) <= 0) {
            setError('Please enter a valid amount greater than ₹0.');
            return;
        }

        setActionLoading(true);
        setError('');
        try {
            // Update claim metadata
            await claimApi.updateClaim(id, formData);
            
            // If new receipt was selected, upload it
            if (receiptFile) {
                await claimApi.uploadReceipt(id, receiptFile);
            }

            // If submitting, trigger state transition
            if (actionType === 'SUBMIT') {
                await claimApi.submitClaim(id);
            }
            navigate('/employee');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update claim.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-500 font-medium">Retrieving claim #{id}...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 text-left">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200/80 pb-6">
                <button 
                    onClick={() => navigate('/employee')}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Claim #{id}</h1>
                        <ClaimStatusBadge status={claimStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {claimStatus === 'REJECTED' 
                            ? 'Adjust details based on reviewer feedback and resubmit for approval.' 
                            : 'Update draft claim before submitting into approval pipeline.'}
                    </p>
                </div>
            </div>

            {/* Stepper with Rejection Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <ClaimStatusStepper 
                    currentStatus={claimStatus} 
                    rejectionReason={rejectionReason} 
                />
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {CATEGORIES.map((cat) => {
                            const isSelected = formData.category === cat.key;
                            const Icon = cat.icon;

                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.key })}
                                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-200'
                                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                                    <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Amount (INR)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Expense Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="date" 
                                value={formData.expenseDate}
                                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Justification & Notes
                    </label>
                    <textarea 
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                {/* Replace Receipt Dropzone */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Upload Replacement Receipt (Optional)</span>
                        <span className="text-[11px] text-slate-400">Leaves current receipt intact if unchanged</span>
                    </label>

                    {!receiptFile ? (
                        <label className="border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-semibold text-slate-600 hover:text-indigo-600">
                            <UploadCloud className="h-4 w-4" />
                            <span>Select new receipt file to override previous document</span>
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={handleFileChange}
                                className="hidden" 
                            />
                        </label>
                    ) : (
                        <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                <span className="text-xs font-bold text-slate-800">{receiptFile.name}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setReceiptFile(null)}
                                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/employee')}
                        className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                    >
                        Back
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAction('SAVE')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                    >
                        Save Edits
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAction('SUBMIT')}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                        {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Resubmit Claim</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditClaim;
