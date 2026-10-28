'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  RecurringTransaction,
  RecurringFrequency,
  Wallet,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@/types/database';
import { formatVND, toDateString, formatDateVN } from '@/lib/utils';
import {
  X,
  Plus,
  Repeat,
  Calendar,
  Check,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringList: RecurringTransaction[];
  wallets: Wallet[];
  onRefresh: () => void;
}

const FREQUENCY_LABELS: { [key in RecurringFrequency]: string } = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  yearly: 'Hàng năm',
};

export function RecurringModal({
  isOpen,
  onClose,
  recurringList,
  wallets,
  onRefresh,
}: RecurringModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[3].name); // Hóa đơn / Điện nước
  const [categoryIcon, setCategoryIcon] = useState(DEFAULT_EXPENSE_CATEGORIES[3].icon);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextRunDate, setNextRunDate] = useState(() => toDateString(new Date()));
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setAmountStr('');
    setCategory(DEFAULT_EXPENSE_CATEGORIES[3].name);
    setCategoryIcon(DEFAULT_EXPENSE_CATEGORIES[3].icon);
    setFrequency('monthly');
    setNextRunDate(toDateString(new Date()));
    setNote('');
    setIsCreating(false);
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amountStr.replace(/\D/g, ''));

    if (!title.trim()) {
      showToast('Vui lòng nhập tên khoản định kỳ (VD: Tiền nhà, Netflix...)', 'error');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ', 'error');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      const { error } = await supabase.from('recurring_transactions').insert([
        {
          user_id: user.id,
          title: title.trim(),
          amount: numAmount,
          type: 'expense',
          category,
          category_icon: categoryIcon,
          wallet_id: walletId || null,
          frequency,
          next_run_date: nextRunDate,
          is_active: true,
          note: note.trim() || null,
        },
      ]);

      if (error) throw error;

      showToast('Đã thêm khoản chi định kỳ thành công', 'success');
      resetForm();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thêm định kỳ';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Nút kích hoạt ghi ngay 1 giao dịch từ khoản định kỳ
  const handleQuickLogNow = async (item: RecurringTransaction) => {
    setTriggeringId(item.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      // 1. Tạo giao dịch vào bảng transactions
      const { error: transErr } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: item.amount,
          type: 'expense',
          category: item.category,
          category_icon: item.category_icon,
          note: `${item.title} (Khoản định kỳ)`,
          transaction_date: toDateString(new Date()),
          wallet_id: item.wallet_id || null,
        },
      ]);
      if (transErr) throw transErr;

      // 2. Cập nhật số dư ví
      if (item.wallet_id) {
        const w = wallets.find((wal) => wal.id === item.wallet_id);
        if (w) {
          await supabase
            .from('wallets')
            .update({ balance: Number(w.balance || 0) - Number(item.amount) })
            .eq('id', item.wallet_id)
            .eq('user_id', user.id);
        }
      }

      // 3. Tăng next_run_date lên kỳ tiếp theo
      const currNext = new Date(item.next_run_date);
      if (item.frequency === 'daily') currNext.setDate(currNext.getDate() + 1);
      else if (item.frequency === 'weekly') currNext.setDate(currNext.getDate() + 7);
      else if (item.frequency === 'monthly') currNext.setMonth(currNext.getMonth() + 1);
      else if (item.frequency === 'yearly') currNext.setFullYear(currNext.getFullYear() + 1);

      await supabase
        .from('recurring_transactions')
        .update({ next_run_date: toDateString(currNext) })
        .eq('id', item.id)
        .eq('user_id', user.id);

      showToast(`Đã ghi sổ thành công ${formatVND(item.amount)} cho ${item.title}!`, 'success');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi ghi sổ';
      showToast(msg, 'error');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa lịch định kỳ này?')) return;
    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
      showToast('Đã xóa thành công', 'success');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa';
      showToast(msg, 'error');
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !currentState })
        .eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật';
      showToast(msg, 'error');
    }
  };

  const totalMonthlyCommitment = recurringList
    .filter((r) => r.is_active)
    .reduce((sum, r) => {
      let monthlyVal = Number(r.amount);
      if (r.frequency === 'daily') monthlyVal *= 30;
      if (r.frequency === 'weekly') monthlyVal *= 4.3;
      if (r.frequency === 'yearly') monthlyVal /= 12;
      return sum + monthlyVal;
    }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quản lý chi tiêu định kỳ"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                  🔄
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Chi Tiêu Định Kỳ & Thuê Bao
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ước tính cố định:{' '}
                    <span className="font-bold text-rose-500">
                      ~{formatVND(Math.round(totalMonthlyCommitment))}/tháng
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form thêm mới */}
            {isCreating ? (
              <form onSubmit={handleCreateRecurring} className="mt-4 space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Tạo khoản chi định kỳ mới
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Đóng lại
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Tên dịch vụ / Khoản chi
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tiền trọ, Netflix, Gói 4G..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Số tiền (VNĐ)
                    </label>
                    <input
                      type="text"
                      value={
                        amountStr
                          ? new Intl.NumberFormat('vi-VN').format(Number(amountStr.replace(/\D/g, '')))
                          : ''
                      }
                      onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-sm font-bold tabular-nums text-rose-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Chu kỳ lặp
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="monthly">Hàng tháng</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="yearly">Hàng năm</option>
                      <option value="daily">Hàng ngày</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Kỳ tới hạn đầu
                    </label>
                    <input
                      type="date"
                      value={nextRunDate}
                      onChange={(e) => setNextRunDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Trừ từ ví
                    </label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 text-xs text-slate-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Lưu lịch định kỳ</span>
                  </button>
                </div>
              </form>
            ) : null}

            {/* List & Controls */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Danh sách thuê bao / hóa đơn ({recurringList.length})
              </span>
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm định kỳ</span>
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2.5">
              {recurringList.length === 0 ? (
                <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-400">
                    Chưa có khoản chi định kỳ nào được cài đặt
                  </p>
                </div>
              ) : (
                recurringList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      item.is_active
                        ? 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121520]'
                        : 'border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                        {item.category_icon || '🔄'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">
                            {FREQUENCY_LABELS[item.frequency] || item.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span className="font-bold tabular-nums text-rose-500">
                            -{formatVND(item.amount)}
                          </span>
                          <span>•</span>
                          <span>Hạn tiếp: {formatDateVN(item.next_run_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={triggeringId === item.id}
                        onClick={() => handleQuickLogNow(item)}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm transition cursor-pointer disabled:opacity-50"
                        title="Ghi sổ ngay khoản này cho hôm nay"
                      >
                        {triggeringId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Ghi ngay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        title={item.is_active ? 'Tạm dừng' : 'Kích hoạt lại'}
                      >
                        {item.is_active ? (
                          <ToggleRight className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
