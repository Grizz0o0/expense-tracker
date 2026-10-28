'use client';

import { TimeFilterPeriod } from '@/types/database';
import { getPeriodDescription } from '@/lib/utils';
import { Calendar, Clock, RotateCcw, LayoutGrid } from 'lucide-react';

interface TimeFilterBarProps {
  currentFilter: TimeFilterPeriod;
  onFilterChange: (filter: TimeFilterPeriod) => void;
  transactionCount: number;
}

const FILTER_OPTIONS: { id: TimeFilterPeriod; label: string; icon: typeof Calendar }[] = [
  { id: 'this_month', label: 'Tháng này', icon: Calendar },
  { id: 'this_week', label: 'Tuần này', icon: Clock },
  { id: 'last_month', label: 'Tháng trước', icon: RotateCcw },
  { id: 'all', label: 'Tất cả', icon: LayoutGrid },
];

export function TimeFilterBar({
  currentFilter,
  onFilterChange,
  transactionCount,
}: TimeFilterBarProps) {
  const { dateRange } = getPeriodDescription(currentFilter);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#10121a]/70 backdrop-blur-md shadow-xs">
      {/* Filter segmented buttons */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
        {FILTER_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = currentFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range preview & Count badge */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 px-1 sm:px-0 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium text-[11px] sm:text-xs">
          {dateRange}
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5 tabular-nums">
          {transactionCount} giao dịch
        </span>
      </div>
    </div>
  );
}
