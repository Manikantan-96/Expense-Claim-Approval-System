import api from './axiosInstance';

export const adminApi = {
    // Expects a raw Long (managerId) in the body
    assignManager: (userId, managerId) => 
        api.put(`/admin/users/${userId}/manager`, managerId, {
            headers: { 'Content-Type': 'application/json' }
        }),
    
    // Expects a raw String (role) in the body
    setRole: (userId, roleString) => 
        api.put(`/admin/users/${userId}/role`, roleString, {
            headers: { 'Content-Type': 'text/plain' } 
        })
};