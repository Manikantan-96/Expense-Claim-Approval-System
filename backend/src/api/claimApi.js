import api from './axiosInstance';

export const claimApi = {
    // Employee Endpoints
    createDraft: (data) => api.post('/claims', data),
    updateClaim: (id, data) => api.put(`/claims/${id}`, data),
    submitClaim: (id) => api.post(`/claims/${id}/submit`),
    getMyClaims: () => api.get('/claims/mine'),
    getClaimById: (id) => api.get(`/claims/${id}`),
    
    // Receipt Handling
    uploadReceipt: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/claims/${id}/receipt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    downloadReceipt: async (id) => {
        const response = await api.get(`/claims/${id}/receipt`, { responseType: 'blob' });
        return URL.createObjectURL(response.data);
    },

    // Manager Endpoints
    getTeamClaims: () => api.get('/claims/team'),
    managerApprove: (id) => api.put(`/claims/${id}/manager-approve`),
    managerReject: (id, reason) => api.put(`/claims/${id}/manager-reject`, { reason }),

    // Finance Endpoints
    getFinanceQueue: (status = 'FINANCE_REVIEW', page = 0, size = 15) => 
        api.get(`/claims/queue?status=${status}&page=${page}&size=${size}`),
    takeClaim: (id) => api.post(`/claims/${id}/take`),
    financeApprove: (id) => api.put(`/claims/${id}/finance-approve`),
    financeReject: (id, reason) => api.put(`/claims/${id}/finance-reject`, { reason }),
    reimburseClaim: (id) => api.put(`/claims/${id}/reimburse`),
};