'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Budget } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { X, Check, Loader2, Target, TrendingUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

const MAX_AMOUNT = 9_999_999_999_999; // 13 digits max for PostgreSQL numeric(15, 2)

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: Budget | null;
  month: number;
  year: number;
  currentMonthExpense: number;
  onSuccess: (budget: Budget | null) => void;
}

export function BudgetModal({
  isOpen,
  onClose,
  currentBudget,
  month,
  year,
  currentMonthExpense,
  onSuccess,
}: BudgetModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentBudget) {
      setAmountStr(String(Math.min(Math.round(currentBudget.amount), MAX_AMOUNT)));
    } else {
      setAmountStr('');
    }
    setErrorMsg('');
  }, [currentBudget, isOpen]);

  // Keyboard Escape listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddPreset = (val: number) => {
    const current = Number(amountStr.replace(/\D/g, '')) || 0;
    const next = Math.min(current + val, MAX_AMOUNT);
    setAmountStr(String(next));
  };

  const handleSetExact = (val: number) => {
    setAmountStr(String(Math.min(val, MAX_AMOUNT)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr.replace(/\D/g, ''));

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Vui lòng nhập hạn mức lớn hơn 0');
      return;
    }

    if (numericAmount > MAX_AMOUNT) {
      setErrorMsg('Hạn mức không được vượt quá 9.999 tỷ VNĐ');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      // Use upsert on unique constraint (user_id, category, month, year) to guarantee idempotency
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: user.id,
            category: 'all',
            amount: numericAmount,
            month,
            year,
          },
          { onConflict: 'user_id,category,month,year' }
        )
        .select()
        .single();

      if (error) throw error;
      const savedBudget = data as Budget;

      showToast(`Đã lưu ngân sách Tháng ${month}/${year}!`, 'success');
      onSuccess(savedBudget);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message === 'Failed to fetch'
        ? 'Lỗi kết nối mạng, vui lòng kiểm tra đường truyền internet.'
        : (error.message || 'Không thể lưu hạn mức ngân sách');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBudget) return;
    if (!confirm(`Bạn có chắc muốn xóa hạn mức ngân sách Tháng ${month}/${year}?`)) return;

    setDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', currentBudget.id)
        .eq('user_id', user.id);

      if (error) throw error;
      showToast(`Đã xóa hạn mức ngân sách Tháng ${month}/${year}`, 'info');
      onSuccess(null);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message === 'Failed to fetch'
        ? 'Lỗi kết nối mạng, vui lòng kiểm tra đường truyền internet.'
        : (error.message || 'Không thể xóa ngân sách');
      setErrorMsg(msg);
    } finally {
      setDeleting(false);
    }
  };

  const displayAmountFormatted = amountStr
    ? new Intl.NumberFormat('vi-VN').format(Number(amountStr.replace(/\D/g, '')))
    : '0';

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-modal-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-7 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 id="budget-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  HẠN MỨC NGÂN SÁCH THÁNG {month}/{year}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kiểm soát chi tiêu và nhận cảnh báo khi vượt ngưỡng
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                {errorMsg}
              </div>
            )}

            {/* Current spending reference */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Đã chi tiêu trong tháng {month}:
                </span>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatVND(currentMonthExpense)}
              </span>
            </div>

            {/* BIG AMOUNT INPUT */}
            <div className="text-center py-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Hạn mức chi tiêu tối đa
              </label>
              <div className="flex items-baseline justify-center gap-1.5 px-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  placeholder="0"
                  value={displayAmountFormatted === '0' && !amountStr ? '' : displayAmountFormatted}
                  onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  className="w-auto min-w-[60px] max-w-[260px] text-right text-3xl sm:text-4xl font-black bg-transparent outline-none tabular-nums tracking-tight text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-lg sm:text-xl font-bold uppercase text-indigo-500/80">
                  vnđ
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                {[1_000_000, 2_000_000, 5_000_000, 10_000_000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddPreset(val)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    +{val / 1_000_000}Tr
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                >
                  Xóa
                </button>
              </div>

              {/* Common targets */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                <span className="text-[10px] text-slate-400 block mb-2 font-medium">
                  Gợi ý hạn mức nhanh:
                </span>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[5_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSetExact(val)}
                      className="px-2.5 py-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:border-indigo-500 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                    >
                      {val / 1_000_000} Triệu
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex items-center gap-2">
              {currentBudget && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                  title="Xóa ngân sách"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-2xl font-semibold text-xs border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
              >
                HỦY
              </button>

              <button
                type="submit"
                disabled={loading || deleting}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>LƯU NGÂN SÁCH</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    ) : null}
  </AnimatePresence>
  );
}
