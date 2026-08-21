import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { claimApi } from '../api/claimApi';
import { ArrowLeft, AlertCircle, UploadCloud } from 'lucide-react';

const EditClaim = () => {
    const { id } = useParams(); // Get claim ID from the URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [claimStatus, setClaimStatus] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    
    const [formData, setFormData] = useState({ category: '', amount: '', expenseDate: '', description: '' });
    const [receiptFile, setReceiptFile] = useState(null);

    // Fetch existing claim data on mount
    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const response = await claimApi.getClaimById(id);
                const data = response.data;
                setFormData({
                    category: data.category,
                    amount: data.amount,
                    expenseDate: data.expenseDate,
                    description: data.description
                });
                setClaimStatus(data.status);
                setRejectionReason(data.rejectionReason);
            } catch (err) {
                setError('Failed to load claim details.');
            } finally {
                setLoading(false);
            }
        };
        fetchClaim();
    }, [id]);

    const handleAction = async (actionType) => {
        setActionLoading(true);
        setError('');
        try {
            // Update the data payload
            await claimApi.updateClaim(id, formData);
            
            // If a new receipt was selected, upload it to override the old one
            if (receiptFile) {
                await claimApi.uploadReceipt(id, receiptFile);
            }

            // If submitting, trigger the status transition
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading claim data...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/employee')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Claim #{id}</h1>
                    <p className="text-sm text-gray-500">Update details and resubmit</p>
                </div>
            </div>

            {claimStatus === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">Claim Rejected</h3>
                        <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
                    </div>
                </div>
            )}

            {error && <div className="bg-red-50 p-3 rounded text-sm text-red-700">{error}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="TRAVEL">Travel</option>
                            <option value="MEALS">Meals</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                        <input type="date" value={formData.expenseDate} onChange={(e) => setFormData({...formData, expenseDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Receipt (Optional)</label>
                    <input type="file" onChange={(e) => setReceiptFile(e.target.files[0])} accept=".jpg,.jpeg,.png,.pdf" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <p className="text-xs text-gray-500 mt-2">Uploading a new file will replace the previously uploaded receipt.</p>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-4">
                    <button type="button" disabled={actionLoading} onClick={() => handleAction('DRAFT')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Update Draft
                    </button>
                    <button type="button" disabled={actionLoading} onClick={() => handleAction('SUBMIT')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {actionLoading ? 'Processing...' : 'Resubmit Claim'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditClaim;