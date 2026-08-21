import React from 'react';
import { Link } from 'react-router-dom'; // Added Link for navigation
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield } from 'lucide-react'; // Added Shield icon

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link to="/" className="text-xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors">
                            Expenseh UI
                        </Link>

                        {/* --- NEW: Navigation Links (Only visible to FINANCE_ADMIN) --- */}
                        {user?.role === 'FINANCE_ADMIN' && (
                            <div className="hidden sm:flex space-x-2">
                                <Link 
                                    to="/finance" 
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Finance Queue
                                </Link>
                                <Link 
                                    to="/admin" 
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                                >
                                    <Shield className="h-4 w-4 mr-1.5"/>
                                    Admin Panel
                                </Link>
                            </div>
                        )}
                        {/* ----------------------------------------------------------- */}
                    </div>

                    {/* Right side: User Profile & Logout */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                            <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium">{user?.sub}</span>
                            <span className="ml-3 px-2 py-0.5 bg-blue-100 text-[10px] font-bold rounded text-blue-700 tracking-wider">
                                {user?.role}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;