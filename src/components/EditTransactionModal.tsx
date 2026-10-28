'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, TransactionType, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/types/database';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

const MAX_AMOUNT = 9_999_999_999_999; // 13 digits max for PostgreSQL numeric(15, 2)

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSuccess: (updated: Transaction) => void;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: EditTransactionModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when transaction changes or modal opens
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmountStr(String(Math.min(Math.round(transaction.amount), MAX_AMOUNT)));
      setCategory(transaction.category);
      setCategoryIcon(transaction.category_icon || (transaction.type === 'expense' ? '🍜' : '💵'));
      setNote(transaction.note || '');
      const rawDate = transaction.transaction_date || '';
      setDate(rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
      setErrorMsg('');
    }
  }, [transaction, isOpen]);

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

  const currentCategories = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  // Preserve and display original custom category if not in default list
  const displayCategories = useMemo(() => {
    const list = [...currentCategories];
    if (
      transaction &&
      transaction.type === type &&
      transaction.category &&
      !list.some((c) => c.name === transaction.category)
    ) {
      list.push({
        name: transaction.category,
        icon: transaction.category_icon || (type === 'expense' ? '🍜' : '💵'),
        color: '#6366f1',
      });
    }
    if (category && !list.some((c) => c.name === category)) {
      list.push({
        name: category,
        icon: categoryIcon || (type === 'expense' ? '🍜' : '💵'),
        color: '#6366f1',
      });
    }
    return list;
  }, [currentCategories, category, categoryIcon, type, transaction]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const targetCats = nextType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
    const exists = targetCats.find((c) => c.name === category);
    if (!exists) {
      setCategory(targetCats[0].name);
      setCategoryIcon(targetCats[0].icon);
    }
  };

  const handleSelectCategory = (name: string, icon: string) => {
    setCategory(name);
    setCategoryIcon(icon);
  };

  const handleAddPreset = (value: number) => {
    const current = Number(amountStr.replace(/\D/g, '')) || 0;
    const next = Math.min(current + value, MAX_AMOUNT);
    setAmountStr(String(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const numericAmount = Number(amountStr.replace(/\D/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (numericAmount > MAX_AMOUNT) {
      setErrorMsg('Số tiền không được vượt quá 9.999 tỷ VNĐ');
      return;
    }

    if (!date || date.length < 10 || isNaN(Date.parse(date))) {
      setErrorMsg('Vui lòng chọn ngày giao dịch hợp lệ');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang hoặc đăng nhập lại.');
      }

      const updatePayload = {
        amount: numericAmount,
        type,
        category,
        category_icon: categoryIcon,
        note: note.trim() || null,
        transaction_date: date,
      };

      const { data, error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', transaction.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      showToast('Cập nhật giao dịch thành công!', 'success');
      onSuccess(data as Transaction);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message === 'Failed to fetch'
        ? 'Lỗi kết nối mạng, vui lòng kiểm tra đường truyền internet.'
        : (error.message || 'Không thể lưu thay đổi');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };


  const displayAmountFormatted = amountStr
    ? new Intl.NumberFormat('vi-VN').format(Number(amountStr.replace(/\D/g, '')))
    : '0';

  return (
    <AnimatePresence>
      {isOpen && transaction ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-transaction-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-7 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span id="edit-transaction-title" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                SỬA GIAO DỊCH
              </span>
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 ml-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Chi tiêu (-)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Thu nhập (+)
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              aria-label="Đóng modal"
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

            {/* BIG AMOUNT DISPLAY */}
            <div className="text-center py-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Số tiền ({type === 'expense' ? 'Đã chi' : 'Thu vào'})
              </label>
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold ${
                    type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                  }`}
                >
                  ₫
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  placeholder="0"
                  value={displayAmountFormatted === '0' && !amountStr ? '' : displayAmountFormatted}
                  onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  className={`w-full max-w-[280px] text-center text-3xl sm:text-4xl font-black bg-transparent outline-none tabular-nums tracking-tight ${
                    type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                  }`}
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                {[1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddPreset(val)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                  >
                    +{val >= 1_000_000 ? `${val / 1_000_000}Tr` : `${val / 1_000}k`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* CATEGORY GRID (1-TAP) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Danh mục
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {displayCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSelectCategory(cat.name, cat.icon)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg shrink-0">{cat.icon}</span>
                      <span className="text-xs font-medium truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NOTE & DATE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Ghi chú (tuỳ chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn trưa cùng đồng nghiệp..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Ngày ghi nhận
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-2xl font-semibold text-xs border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
              >
                HỦY BỎ
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>LƯU THAY ĐỔI</span>
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
