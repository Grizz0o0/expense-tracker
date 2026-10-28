'use client';

import { Budget } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { Target, Settings2, AlertTriangle, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';

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
      <div className="p-5 sm:p-6 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/10 flex flex-col sm:flex-row items-center justify-between gap-4 transition">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hạn mức ngân sách Tháng {month}/{year}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bạn chưa thiết lập ngân sách chi tiêu cho tháng này.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ĐẶT NGÂN SÁCH</span>
        </button>
      </div>
    );
  }

  // Calculate percentage and status
  const budgetAmount = Number(budget.amount);
  const percent = (currentMonthExpense / budgetAmount) * 100;
  const roundedPercent = Math.round(percent);
  const barWidth = Math.min(Math.max(percent, 0), 100);

  // Status tiers according to requirements:
  // - Màu xanh: Chi tiêu dưới 70% ngân sách.
  // - Màu vàng cam: Chi tiêu từ 70% đến 90%.
  // - Màu đỏ: Vượt trên 90% hoặc bội chi.
  let colorTheme: {
    barClass: string;
    textClass: string;
    badgeClass: string;
    icon: typeof CheckCircle2;
    label: string;
  };

  if (percent < 70) {
    colorTheme = {
      barClass: 'bg-emerald-500',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      label: 'Chi tiêu an toàn',
    };
  } else if (percent <= 90) {
    colorTheme = {
      barClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: AlertTriangle,
      label: 'Cần chú ý',
    };
  } else {
    colorTheme = {
      barClass: 'bg-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: AlertCircle,
      label: percent > 100 ? 'Bội chi ngân sách' : 'Cảnh báo (>90%)',
    };
  }

  const StatusIcon = colorTheme.icon;
  const isOverBudget = currentMonthExpense > budgetAmount;
  const diffAmount = Math.abs(budgetAmount - currentMonthExpense);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                HẠN MỨC NGÂN SÁCH THÁNG {month}/{year}
              </h3>
              <span
                className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorTheme.badgeClass}`}
              >
                <StatusIcon className="w-3 h-3" />
                <span>{colorTheme.label}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5 cursor-pointer"
          title="Điều chỉnh ngân sách"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Điều chỉnh</span>
        </button>
      </div>

      {/* Progress Numbers */}
      <div className="flex items-end justify-between gap-2 mb-2.5">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
            Đã chi tiêu thực tế
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatVND(currentMonthExpense)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              / {formatVND(budgetAmount)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
            Tỷ lệ sử dụng
          </span>
          <span className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight ${colorTheme.textClass}`}>
            {roundedPercent}%
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={barWidth}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tiến độ ngân sách: ${roundedPercent}%`}
        className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden p-0.5"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorTheme.barClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Subtext info */}
      <div className="flex items-center justify-between text-xs mt-2.5 text-slate-500 dark:text-slate-400 font-medium">
        <span>
          {isOverBudget ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Đã vượt hạn mức {formatVND(diffAmount)}
            </span>
          ) : (
            <span>
              Còn lại khả dụng:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                {formatVND(diffAmount)}
              </strong>
            </span>
          )}
        </span>

        <span className="text-[11px] text-slate-400">
          {percent < 70
            ? 'Chi tiêu tốt'
            : percent <= 90
            ? 'Cần thắt chặt chi tiêu'
            : 'Đã vượt mức cảnh báo'}
        </span>
      </div>
    </div>
  );
}
