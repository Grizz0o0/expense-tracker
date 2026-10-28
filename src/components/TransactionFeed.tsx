'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { formatVND, formatDateVN } from '@/lib/utils';
import { Trash2, Search, ArrowDownRight, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TransactionFeedProps {
  transactions: Transaction[];
  onDeleted: () => void;
}

export function TransactionFeed({ transactions, onDeleted }: TransactionFeedProps) {
  const supabase = createClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        t.category.toLowerCase().includes(searchLower) ||
        (t.note && t.note.toLowerCase().includes(searchLower)) ||
        String(t.amount).includes(search);
      return matchType && matchSearch;
    });
  }, [transactions, search, filterType]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    for (const t of filtered) {
      if (!groups[t.transaction_date]) {
        groups[t.transaction_date] = [];
      }
      groups[t.transaction_date].push(t);
    }
    return groups;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      onDeleted();
    } catch (err: unknown) {
      const error = err as Error;
      alert('Không thể xóa: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-sm">
      {/* Top filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>LỊCH SỬ GIAO DỊCH</span>
          <span className="text-[11px] font-normal text-slate-400">({filtered.length})</span>
        </h3>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Type */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Chi
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterType === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Thu
            </button>
          </div>
        </div>
      </div>

      {/* Feed List */}
      {sortedDates.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Không tìm thấy giao dịch nào phù hợp
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {sortedDates.map((dateStr) => {
            const items = grouped[dateStr];
            const dateTotal = items.reduce(
              (sum, item) => sum + (item.type === 'expense' ? -Number(item.amount) : Number(item.amount)),
              0
            );

            return (
              <div key={dateStr} className="py-4 first:pt-3">
                {/* Date header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{formatDateVN(dateStr)}</span>
                    <span className="text-[11px] font-normal text-slate-400">({dateStr})</span>
                  </div>
                  <span className={`tabular-nums font-semibold ${dateTotal >= 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {dateTotal >= 0 ? `+${formatVND(dateTotal)}` : formatVND(dateTotal)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-lg shrink-0">
                          {item.category_icon || (item.type === 'expense' ? '🍜' : '💵')}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.category}
                          </div>
                          {item.note && (
                            <div className="text-[11px] text-slate-400 truncate">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-3">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            item.type === 'expense'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.type === 'expense' ? '-' : '+'}
                          {formatVND(item.amount)}
                        </span>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
