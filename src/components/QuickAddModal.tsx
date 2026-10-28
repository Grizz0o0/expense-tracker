'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TransactionType, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/types/database';
import { toDateString } from '@/lib/utils';
import { X, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MAX_AMOUNT = 9_999_999_999_999; // 13 digits max for PostgreSQL numeric(15, 2)

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickAddModal({ isOpen, onClose, onSuccess }: QuickAddModalProps) {
  const supabase = createClient();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [categoryIcon, setCategoryIcon] = useState(DEFAULT_EXPENSE_CATEGORIES[0].icon);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const firstCat = nextType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES[0] : DEFAULT_INCOME_CATEGORIES[0];
    setCategory(firstCat.name);
    setCategoryIcon(firstCat.icon);
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

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: numericAmount,
          type,
          category,
          category_icon: categoryIcon,
          note: note.trim() || null,
          transaction_date: date,
        },
      ]);

      if (error) throw error;

      // Reset
      setAmountStr('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message === 'Failed to fetch'
        ? 'Lỗi kết nối mạng, vui lòng kiểm tra đường truyền internet.'
        : (error.message || 'Không thể lưu giao dịch');
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
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Thêm chi tiêu nhanh"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-7 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            {/* Toggle Thu / Chi */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Thu nhập (+)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
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
                <span className={`text-3xl sm:text-4xl font-extrabold ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
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
                {[10_000, 50_000, 100_000, 500_000].map((val) => (
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
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* CATEGORY GRID (1-TAP) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Chọn danh mục
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {currentCategories.map((cat) => {
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
                  placeholder="Ví dụ: Cà phê cùng bạn bè..."
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-4 py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
              } disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>LƯU {type === 'expense' ? 'KHOẢN CHI' : 'THU NHẬP'}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    ) : null}
  </AnimatePresence>
  );
}
