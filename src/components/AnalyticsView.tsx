'use client';

import { useMemo, useState } from 'react';
import { Transaction, Wallet, Debt } from '@/types/database';
import { formatVND, formatCompactVND } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  debts: Debt[];
}

export function AnalyticsView({ transactions, wallets, debts }: AnalyticsViewProps) {
  const [rangeMonths, setRangeMonths] = useState<number>(6); // 3, 6, 12 months

  // Tính toán dữ liệu 6 tháng gần nhất
  const monthlyData = useMemo(() => {
    const result: {
      key: string; // "2026-05"
      label: string; // "T5/26"
      income: number;
      expense: number;
      net: number;
    }[] = [];

    const now = new Date();
    for (let i = rangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `T${month}/${String(year).slice(2)}`;

      result.push({
        key,
        label,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const map = new Map(result.map((r) => [r.key, r]));

    for (const t of transactions) {
      if (t.type === 'transfer') continue;
      const tKey = t.transaction_date ? t.transaction_date.slice(0, 7) : '';
      const entry = map.get(tKey);
      if (entry) {
        const val = Number(t.amount || 0);
        if (t.type === 'income') {
          entry.income += val;
        } else if (t.type === 'expense') {
          entry.expense += val;
        }
      }
    }

    for (const item of result) {
      item.net = item.income - item.expense;
    }

    return result;
  }, [transactions, rangeMonths]);

  // Max value cho cột biểu đồ
  const maxBarValue = useMemo(() => {
    let max = 1;
    for (const m of monthlyData) {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    }
    return max * 1.15; // Thêm 15% padding đỉnh
  }, [monthlyData]);

  // Phân tích tốc độ chi tiêu tháng này (Burn Rate & Forecast)
  const currentMonthAnalysis = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyData.find((m) => m.key === currentMonthKey) || {
      income: 0,
      expense: 0,
      net: 0,
    };

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // Chi tiêu trung bình mỗi ngày trong tháng
    const dailyExpenseRate = dayOfMonth > 0 ? entry.expense / dayOfMonth : 0;
    // Dự báo tổng chi tiêu cuối tháng
    const projectedMonthExpense = entry.expense + dailyExpenseRate * daysRemaining;
    // Dự báo số dư ròng cuối tháng
    const projectedNet = entry.income - projectedMonthExpense;

    return {
      currentExpense: entry.expense,
      currentIncome: entry.income,
      dailyRate: dailyExpenseRate,
      projectedExpense: projectedMonthExpense,
      projectedNet,
      daysRemaining,
    };
  }, [monthlyData]);

  // Top 5 Danh mục ngốn tiền nhất lịch sử
  const topExpenseCategories = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; icon: string }>();
    let totalAll = 0;

    for (const t of transactions) {
      if (t.type === 'expense') {
        const val = Number(t.amount || 0);
        totalAll += val;
        const exist = map.get(t.category) || {
          name: t.category,
          amount: 0,
          icon: t.category_icon || '📦',
        };
        exist.amount += val;
        map.set(t.category, exist);
      }
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      list: sorted,
      totalAll,
    };
  }, [transactions]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Điều khiển thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Phân Tích Dòng Tiền & Xu Hướng (Analytics)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            So sánh thu chi đa tháng và dự báo tốc độ chi tiêu tài chính
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs font-bold self-start">
          {[
            { label: '3 Tháng', val: 3 },
            { label: '6 Tháng', val: 6 },
            { label: '12 Tháng', val: 12 },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => setRangeMonths(r.val)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                rangeMonths === r.val
                  ? 'bg-white dark:bg-[#1a1d2d] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Biểu đồ cột so sánh Thu vs Chi */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1118] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Thu nhập</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Chi tiêu</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Đơn vị: VNĐ</span>
        </div>

        {/* Khung vẽ cột biểu đồ */}
        <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-slate-100 dark:border-white/5 pb-2">
          {monthlyData.map((m) => {
            const incomeH = Math.min(100, Math.round((m.income / maxBarValue) * 100));
            const expenseH = Math.min(100, Math.round((m.expense / maxBarValue) * 100));

            return (
              <div key={m.key} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Thanh đôi Thu - Chi */}
                <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-w-[50px]">
                  {/* Cột Thu */}
                  <div
                    style={{ height: `${Math.max(incomeH, 3)}%` }}
                    className="w-1/2 rounded-t-md bg-emerald-500/80 group-hover:bg-emerald-500 transition relative flex items-center justify-center cursor-pointer"
                    title={`Thu: ${formatVND(m.income)}`}
                  />

                  {/* Cột Chi */}
                  <div
                    style={{ height: `${Math.max(expenseH, 3)}%` }}
                    className="w-1/2 rounded-t-md bg-rose-500/80 group-hover:bg-rose-500 transition relative flex items-center justify-center cursor-pointer"
                    title={`Chi: ${formatVND(m.expense)}`}
                  />
                </div>

                {/* Nhãn tháng */}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 truncate">
                  {m.label}
                </span>

                {/* Chênh lệch net */}
                <span
                  className={`text-[9px] font-mono tabular-nums font-semibold hidden sm:block ${
                    m.net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {m.net >= 0 ? '+' : ''}
                  {formatCompactVND(m.net)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Khối Dự Báo Dòng Tiền & Cảnh Báo Bội Chi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dự báo Burn Rate */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1118] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Dự Báo Cuối Tháng (Burn-Rate)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
              Còn {currentMonthAnalysis.daysRemaining} ngày
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <span className="text-[11px] text-slate-400 block mb-0.5">Tốc độ chi tiêu/ngày</span>
              <span className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white">
                {formatVND(Math.round(currentMonthAnalysis.dailyRate))}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <span className="text-[11px] text-slate-400 block mb-0.5">Dự phóng chi cả tháng</span>
              <span className="text-base sm:text-lg font-black tabular-nums text-rose-500 dark:text-rose-400">
                ~{formatVND(Math.round(currentMonthAnalysis.projectedExpense))}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {currentMonthAnalysis.projectedNet >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 inline" />
                Nếu duy trì tốc độ này, dự kiến bạn sẽ thặng dư tích lũy{' '}
                <strong>+{formatVND(Math.round(currentMonthAnalysis.projectedNet))}</strong> cuối tháng.
              </span>
            ) : (
              <span className="text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 inline" />
                Cảnh báo: Tốc độ chi hiện tại có thể khiến tháng này bị âm{' '}
                <strong>{formatVND(Math.round(Math.abs(currentMonthAnalysis.projectedNet)))}</strong>.
              </span>
            )}
          </p>
        </div>

        {/* Top 5 Danh mục chi nhiều nhất */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1118] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Top Danh Mục Chi Lớn Nhất
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Tổng: {formatCompactVND(topExpenseCategories.totalAll)}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {topExpenseCategories.list.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có giao dịch chi</p>
            ) : (
              topExpenseCategories.list.map((c) => {
                const pct = topExpenseCategories.totalAll > 0
                  ? Math.round((c.amount / topExpenseCategories.totalAll) * 100)
                  : 0;

                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatVND(c.amount)} ({pct}%)
                      </span>
                    </div>
                    {/* Thanh tỷ lệ */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
