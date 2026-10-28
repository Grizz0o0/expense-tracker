'use client';

import { TimeFilterPeriod } from '@/types/database';
import { Calendar, Filter } from 'lucide-react';

interface TimeFilterBarProps {
  currentFilter: TimeFilterPeriod;
  onFilterChange: (filter: TimeFilterPeriod) => void;
  transactionCount: number;
}

const FILTER_OPTIONS: { id: TimeFilterPeriod; label: string }[] = [
  { id: 'this_month', label: 'Tháng này' },
  { id: 'last_month', label: 'Tháng trước' },
  { id: 'this_week', label: 'Tuần này' },
  { id: 'all', label: 'Tất cả' },
];

export function TimeFilterBar({
  currentFilter,
  onFilterChange,
  transactionCount,
}: TimeFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3 py-2 rounded-2xl fintech-card bg-white dark:bg-[#0f1118]">
      {/* Pills */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = currentFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Transaction counter */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 self-end sm:self-auto px-1">
        <Filter className="w-3.5 h-3.5" />
        <span>Hiển thị <strong className="text-slate-700 dark:text-slate-300 tabular-nums">{transactionCount}</strong> giao dịch</span>
      </div>
    </div>
  );
}
