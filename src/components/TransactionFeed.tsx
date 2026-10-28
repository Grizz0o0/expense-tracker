'use client';

import { useState, useMemo } from 'react';
import { Transaction, Wallet } from '@/types/database';
import { formatVND, formatDateVN } from '@/lib/utils';
import { Trash2, Search, Calendar, Inbox, ArrowRightLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './Toast';
import { CategoryBadge } from './CategoryIcon';

interface TransactionFeedProps {
  transactions: Transaction[];
  wallets?: Wallet[];
  onDeleted: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export function TransactionFeed({
  transactions,
  wallets = [],
  onDeleted,
  onEditTransaction,
}: TransactionFeedProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map ví theo ID
  const walletMap = useMemo(() => {
    const map = new Map<string, Wallet>();
    for (const w of wallets) {
      map.set(w.id, w);
    }
    return map;
  }, [wallets]);

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

  const handleDelete = async (item: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    setDeletingId(item.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const query = supabase.from('transactions').delete().eq('id', item.id);
      if (user?.id) {
        query.eq('user_id', user.id);
      }

      const { error } = await query;
      if (error) throw error;

      // Hoàn lại tiền cho ví nếu xóa giao dịch
      if (item.wallet_id) {
        const wallet = walletMap.get(item.wallet_id);
        if (wallet && user) {
          let refundDiff = 0;
          if (item.type === 'expense') refundDiff = Number(item.amount); // Đã chi -> cộng lại
          if (item.type === 'income') refundDiff = -Number(item.amount); // Đã thu -> trừ đi

          if (refundDiff !== 0) {
            await supabase
              .from('wallets')
              .update({ balance: Number(wallet.balance || 0) + refundDiff })
              .eq('id', wallet.id)
              .eq('user_id', user.id);
          }
        }
      }

      // Nếu là transfer: Hoàn lại tiền cho cả 2 ví
      if (item.type === 'transfer' && item.wallet_id && item.to_wallet_id && user) {
        const fromW = walletMap.get(item.wallet_id);
        const toW = walletMap.get(item.to_wallet_id);
        if (fromW) {
          await supabase
            .from('wallets')
            .update({ balance: Number(fromW.balance || 0) + Number(item.amount) })
            .eq('id', fromW.id)
            .eq('user_id', user.id);
        }
        if (toW) {
          await supabase
            .from('wallets')
            .update({ balance: Number(toW.balance || 0) - Number(item.amount) })
            .eq('id', toW.id)
            .eq('user_id', user.id);
        }
      }

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
            Lịch sử thu chi và chuyển tiền được sắp xếp theo thời gian
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Bộ lọc loại giao dịch */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs font-semibold">
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
            <button
              onClick={() => setFilterType('transfer')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                filterType === 'transfer'
                  ? 'bg-white dark:bg-[#1a1d2d] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Chuyển
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
            {search
              ? 'Không tìm thấy kết quả phù hợp với từ khóa.'
              : 'Bấm nút "Ghi chép" để thêm khoản chi tiêu hoặc thu nhập đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {sortedDates.map((dateStr) => {
            const items = grouped[dateStr];
            const dateTotal = items.reduce((sum, item) => {
              if (item.type === 'transfer') return sum; // transfer không ảnh hưởng tổng thu chi ngày
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
                    Biến động:{' '}
                    <strong
                      className={
                        dateTotal >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400'
                      }
                    >
                      {dateTotal >= 0 ? '+' : ''}
                      {formatVND(dateTotal)}
                    </strong>
                  </div>
                </div>

                {/* Items in date */}
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const isExpense = item.type === 'expense';
                    const isTransfer = item.type === 'transfer';
                    const isDeleting = deletingId === item.id;
                    const wallet = item.wallet_id ? walletMap.get(item.wallet_id) : null;
                    const toWallet = item.to_wallet_id ? walletMap.get(item.to_wallet_id) : null;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isTransfer && onEditTransaction) {
                            onEditTransaction(item);
                          }
                        }}
                        className={`group p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition flex items-center justify-between gap-3 cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06] ${
                          isDeleting ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isTransfer ? (
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">
                              <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
                            </div>
                          ) : (
                            <CategoryBadge category={item.category} size="md" />
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.category}
                              </span>
                              {wallet && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <span>{wallet.icon}</span>
                                  <span>{wallet.name}</span>
                                </span>
                              )}
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
                                isTransfer
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : isExpense
                                  ? 'text-slate-900 dark:text-slate-100'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isTransfer ? '' : isExpense ? '-' : '+'}
                              {formatVND(Number(item.amount))}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">
                              {isTransfer ? 'Chuyển khoản' : isExpense ? 'Chi' : 'Thu'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleDelete(item, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Xóa giao dịch"
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
