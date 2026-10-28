'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { PieChart } from 'lucide-react';

interface SpendingChartProps {
  transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
  // Aggregate expenses by category
  const categoryStats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    if (total === 0) return { list: [], total: 0 };

    const map = new Map<string, { name: string; icon: string; amount: number }>();

    for (const t of expenses) {
      const existing = map.get(t.category) || {
        name: t.category,
        icon: t.category_icon || '📦',
        amount: 0,
      };
      existing.amount += Number(t.amount);
      map.set(t.category, existing);
    }

    const COLORS = [
      '#f97316', '#3b82f6', '#ec4899', '#eab308',
      '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'
    ];

    const list = Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({
        ...item,
        percentage: Math.round((item.amount / total) * 100),
        color: COLORS[index % COLORS.length],
      }));

    return { list, total };
  }, [transactions]);

  if (categoryStats.total === 0) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] flex flex-col items-center justify-center text-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3">
          <PieChart className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Chưa có khoản chi nào
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Bấm nút "+ Thêm chi tiêu" để ghi nhận khoản chi đầu tiên
        </p>
      </div>
    );
  }

  // Calculate SVG Donut segments
  let cumulativePercent = 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>PHÂN BỔ CHI TIÊU</span>
          <span className="text-[11px] font-normal text-slate-400">({categoryStats.list.length} mục)</span>
        </h3>
        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
          {formatVND(categoryStats.total)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* SVG Donut Chart */}
        <div className="md:col-span-5 flex justify-center py-2">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-100 dark:text-white/5"
              />
              {categoryStats.list.map((item, index) => {
                const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                const strokeDashoffset = 100 - cumulativePercent;
                cumulativePercent += item.percentage;

                return (
                  <circle
                    key={index}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out hover:opacity-80"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Đã chi</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                100%
              </span>
            </div>
          </div>
        </div>

        {/* Legend list */}
        <div className="md:col-span-7 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {categoryStats.list.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="shrink-0">{item.icon}</span>
                <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 pl-2">
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatVND(item.amount)}
                </span>
                <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
