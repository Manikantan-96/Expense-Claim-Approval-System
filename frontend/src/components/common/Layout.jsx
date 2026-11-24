import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import DemoPersonaBanner from './DemoPersonaBanner';
import { ShieldCheck, Database, Lock, Cpu } from 'lucide-react';

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-900">
            {/* Top Interactive Recruiter / HR Persona Switcher */}
            <DemoPersonaBanner />

            {/* Main Navigation Header */}
            <Navbar />

            {/* Main Application Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <Outlet />
            </main>

            {/* Clean Enterprise Footer */}
            <footer className="bg-white border-t border-slate-200/80 py-6 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Sentinel Expense Platform</span>
                        <span>•</span>
                        <span>Modular Monolith Spring Boot 3 & React 19</span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3 text-emerald-500" />
                            Data-Scoped AuthZ
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-indigo-500" />
                            Atomic Queue Take
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Database className="h-3 w-3 text-purple-500" />
                            JPA Optimistic Lock
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
