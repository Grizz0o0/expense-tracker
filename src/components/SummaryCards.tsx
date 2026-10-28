'use client';

import { formatVND } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Wallet2, TrendingDown } from 'lucide-react';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  periodLabel?: string;
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  balance,
  periodLabel = 'Kỳ này',
}: SummaryCardsProps) {
  let expenseRatioText = '';
  if (totalIncome > 0) {
    const ratio = Math.round((totalExpense / totalIncome) * 100);
    expenseRatioText = ratio > 100 ? `Vượt thu nhập (${ratio}%)` : `Chiếm ${ratio}% thu nhập`;
  } else if (totalExpense > 0) {
    expenseRatioText = 'Bội chi (chưa có thu nhập)';
  } else {
    expenseRatioText = 'Chưa có phát sinh chi';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* 1. SỐ DƯ KHẢ DỤNG */}
      <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-[#10121a] dark:to-[#10121a] shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          <span>SỐ DƯ HIỆN TẠI</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Wallet2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {formatVND(balance)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Thu trừ Chi ({periodLabel})
        </div>
      </div>

      {/* 2. TỔNG THU NHẬP */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          <span>TỔNG THU VÀO</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
          +{formatVND(totalIncome)}
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Lương, thưởng & nguồn thu
        </div>
      </div>

      {/* 3. TỔNG CHI TIÊU */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
          <span>TỔNG ĐÃ CHI</span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-rose-600 dark:text-rose-400">
          -{formatVND(totalExpense)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <span>{expenseRatioText}</span>
        </div>
      </div>
    </div>
  );
}
