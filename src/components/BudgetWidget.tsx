'use client';

import { Budget } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { Target, Settings2, AlertTriangle, CheckCircle2, AlertCircle, Plus, ChevronRight } from 'lucide-react';

interface BudgetWidgetProps {
  budget: Budget | null;
  currentMonthExpense: number;
  month: number;
  year: number;
  onOpenModal: () => void;
}

export function BudgetWidget({
  budget,
  currentMonthExpense,
  month,
  year,
  onOpenModal,
}: BudgetWidgetProps) {
  // If no budget set yet
  if (!budget || !budget.amount || budget.amount <= 0) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl fintech-card bg-gradient-to-r from-indigo-50/50 via-white to-white dark:from-[#111422] dark:via-[#0f1118] dark:to-[#0f1118] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Hạn mức ngân sách Tháng {month}/{year}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập kế hoạch chi tiêu tháng để nhận cảnh báo thông minh khi sắp chạm ngưỡng.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Đặt Ngân Sách</span>
        </button>
      </div>
    );
  }

  // Calculate percentage and status
  const budgetAmount = Number(budget.amount);
  const percent = (currentMonthExpense / budgetAmount) * 100;
  const roundedPercent = Math.round(percent);
  const barWidth = Math.min(Math.max(percent, 0), 100);

  // Status configuration
  let statusBadge = {
    label: 'An toàn',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    barColor: 'bg-emerald-500',
    icon: CheckCircle2,
  };

  if (percent > 90) {
    statusBadge = {
      label: percent > 100 ? 'Bội chi' : 'Báo động',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      barColor: 'bg-rose-500',
      icon: AlertCircle,
    };
  } else if (percent >= 70) {
    statusBadge = {
      label: 'Cảnh báo',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
    };
  }

  const StatusIcon = statusBadge.icon;
  const remaining = budgetAmount - currentMonthExpense;

  return (
    <div className="p-5 rounded-2xl fintech-card bg-white dark:bg-[#0f1118]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ngân Sách Tháng {month}/{year}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label} ({roundedPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hạn mức: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatVND(budgetAmount)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-right sm:text-right">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {remaining >= 0 ? 'Còn lại khả dụng' : 'Vượt hạn mức'}
            </div>
            <div className={`text-base font-extrabold tabular-nums ${remaining >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'}`}>
              {formatVND(Math.abs(remaining))}
            </div>
          </div>

          <button
            onClick={onOpenModal}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
            title="Điều chỉnh hạn mức"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar with modern sleek finish */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${statusBadge.barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
          <span>Đã chi: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatVND(currentMonthExpense)}</strong></span>
          <span>{roundedPercent}% / 100%</span>
        </div>
      </div>
    </div>
  );
}
