import React, { useState } from 'react';
import { X, Shield, Zap, Lock, GitFork, Check, ArrowRight, Code, Server, Database } from 'lucide-react';

const ArchitectureModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('auth');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                            <Shield className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">System Architecture & Engineering Highlights</h3>
                            <p className="text-xs text-indigo-200/80">Key technical differentiators built into this project</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2">
                    <button
                        onClick={() => setActiveTab('auth')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'auth'
                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Shield className="h-4 w-4" />
                        1. Data-Scoped AuthZ
                    </button>
                    <button
                        onClick={() => setActiveTab('concurrency')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'concurrency'
                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Zap className="h-4 w-4" />
                        2. Atomic Concurrency Lock
                    </button>
                    <button
                        onClick={() => setActiveTab('receipts')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'receipts'
                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Lock className="h-4 w-4" />
                        3. Private Receipt Vault
                    </button>
                    <button
                        onClick={() => setActiveTab('statemachine')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                            activeTab === 'statemachine'
                                ? 'border-indigo-600 text-indigo-600 bg-white'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GitFork className="h-4 w-4" />
                        4. State Machine Engine
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-left">
                    {activeTab === 'auth' && (
                        <div className="space-y-4">
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                    Why Role-Based Access Control (RBAC) Alone Fails
                                </h4>
                                <p className="text-xs text-indigo-900/80 mt-1.5 leading-relaxed">
                                    Most expense systems check <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800">hasRole('MANAGER')</code> and stop there. 
                                    This introduces a major vulnerability (IDOR): Any manager can approve claims for employees they do not manage.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Naive Tutorial Implementation</span>
                                    <pre className="mt-2 text-xs bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto font-mono">
{`// ❌ Danger: allows IDOR
@PreAuthorize("hasRole('MANAGER')")
public Claim approve(@PathVariable Long id) {
    return repo.save(claim);
}`}
                                    </pre>
                                </div>

                                <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">This Project's Architecture</span>
                                    <pre className="mt-2 text-xs bg-slate-900 text-emerald-300 p-3 rounded-lg overflow-x-auto font-mono">
{`// ✅ Direct Reporting Verification
User manager = getLoggedInUser();
if (claim.getEmployee().getManager() == null || 
    !claim.getEmployee().getManager().getId().equals(manager.getId())) {
    throw new SecurityException("403: Not your report");
}`}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'concurrency' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                                <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-600" />
                                    Double-Take Race Condition on Finance Queue
                                </h4>
                                <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                                    When multiple finance officers view the shared claims queue, two people can click "Take Claim" at the exact same millisecond. 
                                    A read-modify-write pattern causes both requests to believe they won the claim.
                                </p>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-100 font-mono text-xs">
                                <span className="text-amber-400 font-bold block mb-2">// Atomic Conditional SQL Update Executed at DB Level</span>
                                <div className="text-slate-300 space-y-1">
                                    <p><span className="text-purple-400">UPDATE</span> expense_claims</p>
                                    <p><span className="text-purple-400">SET</span> status = <span className="text-emerald-400">'FINANCE_PROCESSING'</span>, assigned_finance_id = :adminId</p>
                                    <p><span className="text-purple-400">WHERE</span> id = :claimId</p>
                                    <p>&nbsp;&nbsp;<span className="text-purple-400">AND</span> status = <span className="text-emerald-400">'FINANCE_REVIEW'</span></p>
                                    <p>&nbsp;&nbsp;<span className="text-purple-400">AND</span> assigned_finance_id <span className="text-purple-400">IS NULL</span>;</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
                                    💡 Returns affected row count: <code className="text-emerald-400 font-mono">1</code> for the winner; <code className="text-rose-400 font-mono">0</code> for the loser, which immediately maps to a clean <strong className="text-white">HTTP 409 Conflict</strong>.
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'receipts' && (
                        <div className="space-y-4">
                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                                <h4 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-purple-600" />
                                    Zero Public Exposure for Sensitive Financial Documents
                                </h4>
                                <p className="text-xs text-purple-900/80 mt-1 leading-relaxed">
                                    Receipts contain invoices, tax IDs, credit card digits, and vendor contracts. They are never exposed via public static URLs or public S3 buckets.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                    <h5 className="font-bold text-slate-800">1. UUID Key Sanitization</h5>
                                    <p className="text-slate-500 mt-1">User filenames are discarded. Files are stored as randomized UUIDs to eliminate directory traversal attacks.</p>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                    <h5 className="font-bold text-slate-800">2. Streamed Binary Blobs</h5>
                                    <p className="text-slate-500 mt-1">Backend validates Bearer token and direct relationship before streaming bytes with inline Content-Disposition.</p>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                    <h5 className="font-bold text-slate-800">3. Ephemeral Client Memory</h5>
                                    <p className="text-slate-500 mt-1">React renders receipts using temporary blob URLs (<code className="font-mono">URL.createObjectURL</code>) and revokes them when the modal closes.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'statemachine' && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h4 className="font-bold text-sm text-slate-900">Deterministic State Transitions</h4>
                                <p className="text-xs text-slate-600 mt-1">
                                    Controllers never modify statuses directly. All state progressions enforce business constraints in the service layer.
                                </p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                                    <span className="font-semibold text-slate-700">DRAFT</span>
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span className="font-semibold text-amber-700">MANAGER_REVIEW</span>
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span className="font-semibold text-orange-700">FINANCE_REVIEW</span>
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span className="font-semibold text-purple-700">FINANCE_PROCESSING</span>
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span className="font-semibold text-emerald-700">APPROVED</span>
                                    <ArrowRight className="h-3 w-3 text-slate-400" />
                                    <span className="font-semibold text-teal-700">REIMBURSED</span>
                                </div>
                                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md">
                                    * Exception rules: If an employee has no assigned manager, claims auto-route directly to <span className="font-mono text-orange-700">FINANCE_REVIEW</span>. If rejected, claims return to <span className="font-mono text-rose-700">REJECTED</span> and can be edited and resubmitted.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                        Built with Spring Boot 3, React 19, Tailwind CSS, & MySQL
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                        Close Overview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchitectureModal;
