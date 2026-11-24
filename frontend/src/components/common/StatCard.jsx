import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badge }) => {
    const colorStyles = {
        indigo: {
            bg: 'bg-indigo-50/70',
            icon: 'text-indigo-600',
            border: 'hover:border-indigo-200'
        },
        emerald: {
            bg: 'bg-emerald-50/70',
            icon: 'text-emerald-600',
            border: 'hover:border-emerald-200'
        },
        amber: {
            bg: 'bg-amber-50/70',
            icon: 'text-amber-600',
            border: 'hover:border-amber-200'
        },
        purple: {
            bg: 'bg-purple-50/70',
            icon: 'text-purple-600',
            border: 'hover:border-purple-200'
        },
        rose: {
            bg: 'bg-rose-50/70',
            icon: 'text-rose-600',
            border: 'hover:border-rose-200'
        }
    };

    const currentStyle = colorStyles[color] || colorStyles.indigo;

    return (
        <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${currentStyle.border}`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${currentStyle.bg} ${currentStyle.icon}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {(subtitle || badge) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {subtitle && <span className="text-slate-500">{subtitle}</span>}
                    {badge && (
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatCard;
