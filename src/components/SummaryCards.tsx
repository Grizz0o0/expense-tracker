'use client';

import { formatVND } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Sparkles } from 'lucide-react';

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
  let ratioPercentage = 0;
  if (totalIncome > 0) {
    ratioPercentage = Math.round((totalExpense / totalIncome) * 100);
    expenseRatioText = ratioPercentage > 100 
      ? `Vượt thu nhập +${ratioPercentage - 100}%` 
      : `${ratioPercentage}% tổng thu`;
  } else if (totalExpense > 0) {
    expenseRatioText = 'Chưa có thu bù chi';
  } else {
    expenseRatioText = 'Chưa có phát sinh chi';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. SỐ DƯ HIỆN TẠI */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl fintech-card bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-[#151928] dark:via-[#0f1118] dark:to-[#0f1118]">
        {/* Glow corner accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-indigo-500" />
            Số dư khả dụng
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {periodLabel}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-slate-950 dark:text-white">
          {formatVND(balance)}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Dòng tiền ròng</span>
          <span className={`font-semibold tabular-nums ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {balance >= 0 ? '+' : ''}{formatVND(balance)}
          </span>
        </div>
      </div>

      {/* 2. TỔNG THU NHẬP */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl fintech-card bg-white dark:bg-[#0f1118]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Tổng thu vào
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
          +{formatVND(totalIncome)}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Nguồn thu đã ghi</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Lương, thưởng & khác
          </span>
        </div>
      </div>

      {/* 3. TỔNG CHI TIÊU */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl fintech-card bg-white dark:bg-[#0f1118]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Tổng chi ra
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-rose-600 dark:text-rose-400">
          -{formatVND(totalExpense)}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Tỷ lệ chi tiêu</span>
          <span className={`font-semibold tabular-nums text-[11px] px-1.5 py-0.5 rounded ${
            ratioPercentage > 90 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
          }`}>
            {expenseRatioText}
          </span>
        </div>
      </div>
    </div>
  );
}
