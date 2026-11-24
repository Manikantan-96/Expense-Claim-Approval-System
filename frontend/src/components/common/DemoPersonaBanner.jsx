import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Sparkles, Shield, ArrowRight, Check, Loader2 } from 'lucide-react';
import ArchitectureModal from './ArchitectureModal';

const DemoPersonaBanner = () => {
    const { user, switchPersona, isSwitchingPersona, demoPersonas } = useAuth();
    const [isArchModalOpen, setIsArchModalOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);

    const handleSwitch = async (personaKey) => {
        setSelectedKey(personaKey);
        try {
            await switchPersona(personaKey);
        } catch (e) {
            alert("Could not automatically switch demo account. Backend may be waking up or credentials changed.");
        } finally {
            setSelectedKey(null);
        }
    };

    return (
        <>
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 shadow-md border-b border-indigo-900/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                    {/* Left: Project Context Pill */}
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold text-indigo-200">
                            HR & Reviewer Interactive Tour:
                        </span>
                        <span className="text-slate-300 hidden lg:inline">
                            Switch roles instantly to inspect multi-tier workflows without typing passwords
                        </span>
                    </div>

                    {/* Center: 1-Click Persona Switcher */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {demoPersonas.map((persona) => {
                            const isActive = user?.role === persona.role;
                            const isCurrentLoading = isSwitchingPersona && selectedKey === persona.key;

                            return (
                                <button
                                    key={persona.key}
                                    onClick={() => handleSwitch(persona.key)}
                                    disabled={isSwitchingPersona}
                                    title={persona.description}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400 font-bold scale-102'
                                            : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white'
                                    } disabled:opacity-50`}
                                >
                                    {isCurrentLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : isActive ? (
                                        <Check className="h-3 w-3 text-emerald-300" />
                                    ) : (
                                        <User className="h-3 w-3 opacity-70" />
                                    )}
                                    <span>{persona.label}</span>
                                    <span className="text-[10px] opacity-75 hidden sm:inline">({persona.name.split(' ')[0]})</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Architecture Highlights Button */}
                    <button
                        onClick={() => setIsArchModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-amber-200 rounded-lg border border-amber-500/40 font-semibold transition-all shadow-xs"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>System Highlights</span>
                    </button>
                </div>
            </div>

            <ArchitectureModal 
                isOpen={isArchModalOpen} 
                onClose={() => setIsArchModalOpen(false)} 
            />
        </>
    );
};

export default DemoPersonaBanner;
