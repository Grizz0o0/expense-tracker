'use client';

import { useMemo } from 'react';
import { Transaction } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { PieChart, Sparkles } from 'lucide-react';
import { CategoryBadge } from './CategoryIcon';

interface SpendingChartProps {
  transactions: Transaction[];
}

export function SpendingChart({ transactions }: SpendingChartProps) {
  // Aggregate expenses by category
  const categoryStats = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    if (total === 0) return { list: [], total: 0 };

    const map = new Map<string, { name: string; amount: number }>();

    for (const t of expenses) {
      const existing = map.get(t.category) || {
        name: t.category,
        amount: 0,
      };
      existing.amount += Number(t.amount);
      map.set(t.category, existing);
    }

    const COLORS = [
      '#4f46e5', // Indigo
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#f97316', // Orange
      '#3b82f6', // Blue
      '#64748b', // Slate
    ];

    let acc = 0;
    const list = Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => {
        const exactPercentage = (item.amount / total) * 100;
        const strokeDashoffset = 100 - acc;
        acc += exactPercentage;
        const displayPercentage =
          exactPercentage < 1 && item.amount > 0 ? '<1%' : `${Math.round(exactPercentage)}%`;
        return {
          ...item,
          exactPercentage,
          displayPercentage,
          strokeDashoffset,
          color: COLORS[index % COLORS.length],
        };
      });

    return { list, total };
  }, [transactions]);

  if (categoryStats.total === 0) {
    return (
      <div className="p-6 rounded-2xl fintech-card bg-white dark:bg-[#0f1118] text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-3">
          <PieChart className="w-6 h-6 stroke-[1.8]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Chưa có số liệu chi tiêu
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Biểu đồ phân bổ tỷ lệ phần trăm các nhóm chi tiêu sẽ hiển thị khi bạn phát sinh khoản chi.
        </p>
      </div>
    );
  }

  const isSingleCategory = categoryStats.list.length === 1;

  return (
    <div className="p-5 sm:p-6 rounded-2xl fintech-card bg-white dark:bg-[#0f1118]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Cơ Cấu Chi Tiêu</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân tích tỷ trọng danh mục trong kỳ được chọn
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Tổng chi</span>
          <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
            {formatVND(categoryStats.total)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Modern Donut Chart SVG */}
        <div className="md:col-span-5 flex justify-center py-2">
          <div className="relative w-44 h-44 sm:w-48 sm:h-48">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 transform">
              {/* Background ring */}
              <circle
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                className="text-slate-100 dark:text-white/[0.05]"
              />

              {/* Data segments */}
              {categoryStats.list.map((cat) => {
                if (isSingleCategory) {
                  return (
                    <circle
                      key={cat.name}
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  );
                }

                return (
                  <circle
                    key={cat.name}
                    cx="18"
                    cy="18"
                    r="15.91549430918954"
                    fill="none"
                    stroke={cat.color}
                    strokeWidth="3.2"
                    strokeDasharray={`${cat.exactPercentage} ${100 - cat.exactPercentage}`}
                    strokeDashoffset={cat.strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                );
              })}
            </svg>

            {/* Inner center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hạng mục lớn nhất
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 truncate max-w-[100px]">
                {categoryStats.list[0]?.name || ''}
              </span>
              <span className="text-xs font-semibold tabular-nums text-indigo-500">
                {categoryStats.list[0]?.displayPercentage || ''}
              </span>
            </div>
          </div>
        </div>

        {/* Legend list */}
        <div className="md:col-span-7 space-y-2.5">
          {categoryStats.list.slice(0, 6).map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {cat.name}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400 font-medium tabular-nums">
                  {cat.displayPercentage}
                </span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatVND(cat.amount)}
                </span>
              </div>
            </div>
          ))}

          {categoryStats.list.length > 6 && (
            <div className="text-center pt-1 text-[11px] text-slate-400">
              +{categoryStats.list.length - 6} danh mục khác
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
