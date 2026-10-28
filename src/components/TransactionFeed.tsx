'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { formatVND, formatDateVN } from '@/lib/utils';
import { Trash2, Pencil, Search, Calendar, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './Toast';
import { CategoryBadge } from './CategoryIcon';

interface TransactionFeedProps {
  transactions: Transaction[];
  onDeleted: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export function TransactionFeed({
  transactions,
  onDeleted,
  onEditTransaction,
}: TransactionFeedProps) {
  const supabase = createClient();
  const { showToast } = useToast();
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
      const dKey = t.transaction_date
        ? t.transaction_date.includes('T')
          ? t.transaction_date.split('T')[0]
          : t.transaction_date
        : '';
      if (!groups[dKey]) {
        groups[dKey] = [];
      }
      groups[dKey].push(t);
    }
    return groups;
  }, [filtered]);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa khoản ghi chép này?')) return;
    setDeletingId(id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const query = supabase.from('transactions').delete().eq('id', id);
      if (user?.id) {
        query.eq('user_id', user.id);
      }

      const { error } = await query;
      if (error) throw error;

      showToast('Đã xóa giao dịch thành công', 'success');
      onDeleted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa giao dịch';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl fintech-card bg-white dark:bg-[#0f1118] overflow-hidden">
      {/* Header with Search and Type Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Dòng Tiền Giao Dịch
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Lịch sử thu chi được sắp xếp theo trình tự thời gian
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo danh mục, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Type segmented filter */}
          <div className="flex bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white dark:bg-[#1a1d2d] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'expense'
                  ? 'bg-white dark:bg-[#1a1d2d] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Chi
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'income'
                  ? 'bg-white dark:bg-[#1a1d2d] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Thu
            </button>
          </div>
        </div>
      </div>

      {/* List Content */}
      {filtered.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 stroke-[1.5]" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chưa có giao dịch nào
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {search ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Bấm nút "Ghi chép mới" để thêm khoản thu hoặc chi đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {sortedDates.map((dateStr) => {
            const items = grouped[dateStr];
            const dateTotal = items.reduce((sum, item) => {
              return item.type === 'income' ? sum + Number(item.amount) : sum - Number(item.amount);
            }, 0);

            return (
              <div key={dateStr} className="p-4 sm:p-5">
                {/* Date Header */}
                <div className="flex items-center justify-between text-xs mb-3 text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{formatDateVN(dateStr)}</span>
                  </div>
                  <div className="font-mono text-[11px] tabular-nums">
                    Biến động: <strong className={dateTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>
                      {dateTotal >= 0 ? '+' : ''}{formatVND(dateTotal)}
                    </strong>
                  </div>
                </div>

                {/* Items in date */}
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const isExpense = item.type === 'expense';
                    const isDeleting = deletingId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => onEditTransaction && onEditTransaction(item)}
                        className={`group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition flex items-center justify-between gap-3 cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06] ${
                          isDeleting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryBadge category={item.category} size="md" />

                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {item.category}
                            </div>
                            {item.note ? (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.note}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">
                                Không có ghi chú
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-sm sm:text-base font-bold tabular-nums tracking-tight ${
                                isExpense
                                  ? 'text-slate-900 dark:text-slate-100'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isExpense ? '-' : '+'}{formatVND(Number(item.amount))}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">
                              {isExpense ? 'Chi' : 'Thu'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTransaction && onEditTransaction(item);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition cursor-pointer"
                              title="Sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
