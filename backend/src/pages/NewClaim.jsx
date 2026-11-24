import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimApi } from '../api/claimApi';
import { 
    UploadCloud, 
    ArrowLeft, 
    AlertCircle, 
    Plane, 
    Coffee, 
    Laptop, 
    Tag, 
    FileText, 
    Check, 
    X, 
    Loader2, 
    ShieldCheck,
    Calendar,
    IndianRupee,
    Info
} from 'lucide-react';

const CATEGORIES = [
    { key: 'TRAVEL', label: 'Travel & Lodging', desc: 'Flights, cabs, train tickets, hotel stays', icon: Plane },
    { key: 'MEALS', label: 'Client Meals & Dining', desc: 'Team dinners, client meals, conference catering', icon: Coffee },
    { key: 'EQUIPMENT', label: 'Hardware & Gear', desc: 'Monitors, peripherals, ergonomic office supplies', icon: Laptop },
    { key: 'OTHER', label: 'Software & Misc', desc: 'Subscriptions, certification fees, books', icon: Tag },
];

const NewClaim = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        category: 'TRAVEL',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleCategorySelect = (categoryKey) => {
        setFormData(prev => ({ ...prev, category: categoryKey }));
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError('Receipt file size must be less than 5 MB.');
                return;
            }
            setReceiptFile(file);
            setError('');
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const removeFile = () => {
        setReceiptFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const handleAction = async (actionType) => {
        if (!formData.amount || Number(formData.amount) <= 0) {
            setError('Please enter a valid amount greater than ₹0.');
            return;
        }
        if (!formData.expenseDate) {
            setError('Expense date is required.');
            return;
        }
        if (!formData.description.trim()) {
            setError('Please provide a business justification description.');
            return;
        }
        if (actionType === 'SUBMIT' && !receiptFile) {
            setError('Corporate reimbursement policy requires an itemized receipt to submit for approval.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: Create Draft
            const draftRes = await claimApi.createDraft(formData);
            const claimId = draftRes.data.id;

            // Step 2: Upload Receipt
            if (receiptFile) {
                await claimApi.uploadReceipt(claimId, receiptFile);
            }

            // Step 3: Trigger State Machine Auto-Routing
            if (actionType === 'SUBMIT') {
                await claimApi.submitClaim(claimId);
            }

            navigate('/employee');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while saving the expense claim.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Expense Claim</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        File expenses with itemized receipts for automated manager and treasury routing.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
                {/* 1. Category Selection Cards */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        1. Select Expense Category
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = formData.category === cat.key;

                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat.key)}
                                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                        isSelected
                                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-200'
                                            : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">{cat.label}</h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Amount and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            2. Expense Amount (INR)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                            <input 
                                type="number" 
                                name="amount"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-3 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            3. Transaction Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input 
                                type="date" 
                                name="expenseDate"
                                value={formData.expenseDate}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Description */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        4. Business Purpose & Justification
                    </label>
                    <textarea 
                        name="description"
                        rows="3"
                        placeholder="Detail client meeting, hotel booking reference, or hardware purchased for engineering work..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                {/* 4. Drag & Drop Receipt Upload Dropzone */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>5. Attach Receipt Document</span>
                        <span className="text-[11px] text-slate-400 font-normal">JPG, PNG, or PDF up to 5 MB</span>
                    </label>

                    {!receiptFile ? (
                        <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <UploadCloud className="h-9 w-9 text-indigo-500 mb-2" />
                            <span className="text-xs font-bold text-slate-700">Click to browse or drag & drop receipt</span>
                            <span className="text-[11px] text-slate-400 mt-1">Files are encrypted and stored in private vault</span>
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={handleFileChange}
                                className="hidden" 
                            />
                        </label>
                    ) : (
                        <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Receipt preview" className="h-12 w-12 object-cover rounded-lg border border-indigo-200" />
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                )}
                                <div>
                                    <h5 className="text-xs font-bold text-slate-900">{receiptFile.name}</h5>
                                    <p className="text-[11px] text-slate-500">{(receiptFile.size / 1024).toFixed(1)} KB • Attached</p>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={removeFile}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove File"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Policy Notice */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                        Submissions route automatically to your direct manager for review. If no manager is assigned, claims auto-escalate directly to Finance review.
                    </span>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/employee')}
                        className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAction('DRAFT')}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        Save as Draft
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAction('SUBMIT')}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                <span>Submit for Approval</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewClaim;
