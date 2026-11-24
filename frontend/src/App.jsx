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
import AdminDashboard from './pages/AdminDashboard';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Session...</p>
                </div>
            </div>
        );
    }
    
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
                {/* Public Authentication Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<DashboardRedirect />} />

                {/* Authenticated Layout with Demo Persona Bar & Navbar */}
                <Route element={<Layout />}>
                    {/* Employee & Manager Self-Service Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER']} />}>
                        <Route path="/employee" element={<EmployeeDashboard />} />
                        <Route path="/employee/new" element={<NewClaim />} />
                        <Route path="/employee/edit/:id" element={<EditClaim />} />
                    </Route>

                    {/* Manager Approval Queue */}
                    <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
                        <Route path="/manager" element={<ManagerDashboard />} />
                    </Route>

                    {/* Finance & System Governance Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['FINANCE_ADMIN']} />}>
                        <Route path="/finance" element={<FinanceDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                    </Route>
                </Route>

                {/* Catch-all Wildcard */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
