import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimApi } from '../api/claimApi';
import { UploadCloud, ArrowLeft, AlertCircle } from 'lucide-react';

const NewClaim = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        category: 'TRAVEL',
        amount: '',
        expenseDate: '',
        description: ''
    });
    const [receiptFile, setReceiptFile] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleAction = async (actionType) => {
        // Basic frontend validation
        if (!formData.amount || !formData.expenseDate || !formData.description) {
            setError('Please fill in all required fields.');
            return;
        }
        if (actionType === 'SUBMIT' && !receiptFile) {
            setError('A receipt is required to submit a claim.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: Create the Draft
            const draftRes = await claimApi.createDraft(formData);
            const claimId = draftRes.data.id;

            // Step 2: Upload Receipt (if provided)
            if (receiptFile) {
                await claimApi.uploadReceipt(claimId, receiptFile);
            }

            // Step 3: Trigger State Machine Transition (if submitting)
            if (actionType === 'SUBMIT') {
                await claimApi.submitClaim(claimId);
            }

            // Success! Send user back to dashboard
            navigate('/employee');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while saving the claim.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => navigate('/employee')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Claim</h1>
                    <p className="text-sm text-gray-500 mt-1">Submit a new expense for reimbursement</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="TRAVEL">Travel</option>
                                <option value="MEALS">Meals</option>
                                <option value="EQUIPMENT">Equipment</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                            <input 
                                type="number" 
                                name="amount" 
                                step="0.01"
                                min="0.01"
                                value={formData.amount} 
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                            <input 
                                type="date" 
                                name="expenseDate" 
                                value={formData.expenseDate} 
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            name="description" 
                            rows="3" 
                            value={formData.description} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Briefly describe the business purpose..."
                        />
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Upload (Required for submission)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                                {receiptFile && (
                                    <p className="text-sm font-semibold text-green-600 mt-2">Selected: {receiptFile.name}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-4">
                    <button 
                        type="button" 
                        disabled={loading}
                        onClick={() => handleAction('DRAFT')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
                    >
                        Save as Draft
                    </button>
                    <button 
                        type="button" 
                        disabled={loading}
                        onClick={() => handleAction('SUBMIT')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-blue-400 flex items-center"
                    >
                        {loading ? 'Processing...' : 'Submit Claim'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewClaim;