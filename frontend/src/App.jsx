import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import EmployeeDashboard from './pages/EmployeeDashboard';
import NewClaim from './pages/NewClaim';
import EditClaim from './pages/EditClaim';
import ManagerDashboard from './pages/ManagerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
// 1. ADD THIS IMPORT
import AdminDashboard from './pages/AdminDashboard'; 

const DashboardRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return null; 
    if (!user) return <Navigate to="/login" replace />;
    
    switch (user.role) {
        case 'FINANCE_ADMIN': return <Navigate to="/finance" replace />;
        case 'MANAGER': return <Navigate to="/manager" replace />;
        case 'EMPLOYEE': default: return <Navigate to="/employee" replace />;
    }
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<DashboardRedirect />} />

                {/* Protected Layout */}
                <Route element={<Layout />}>
                    <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER']} />}>
                        <Route path="/employee" element={<EmployeeDashboard />} />
                        <Route path="/employee/new" element={<NewClaim />} />
                        <Route path="/employee/edit/:id" element={<EditClaim />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                        <Route path="/manager" element={<ManagerDashboard />} />
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['FINANCE_ADMIN']} />}>
                        <Route path="/finance" element={<FinanceDashboard />} />
                        {/* 2. ADD THIS ROUTE */}
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>
                </Route>

                {/* 3. The Wildcard that was silently catching the missing route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;