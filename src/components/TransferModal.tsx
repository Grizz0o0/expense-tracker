'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet } from '@/types/database';
import { toDateString, formatVND } from '@/lib/utils';
import { X, Check, Loader2, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSuccess: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  wallets,
  onSuccess,
}: TransferModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [loading, setLoading] = useState(false);

  // Đồng bộ lại khi danh sách wallets thay đổi
  if (wallets.length >= 2 && (!fromWalletId || !toWalletId || fromWalletId === toWalletId)) {
    if (!fromWalletId) setFromWalletId(wallets[0].id);
    if (!toWalletId || toWalletId === wallets[0].id) setToWalletId(wallets[1].id);
  }

  const handleSwap = () => {
    const temp = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(temp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr.replace(/\D/g, ''));

    if (!numericAmount || numericAmount <= 0) {
      showToast('Vui lòng nhập số tiền chuyển hợp lệ', 'error');
      return;
    }

    if (!fromWalletId || !toWalletId) {
      showToast('Vui lòng chọn ví nguồn và ví đích', 'error');
      return;
    }

    if (fromWalletId === toWalletId) {
      showToast('Ví nguồn và ví đích phải khác nhau', 'error');
      return;
    }

    const fromWallet = wallets.find((w) => w.id === fromWalletId);
    const toWallet = wallets.find((w) => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      showToast('Không tìm thấy thông tin ví', 'error');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      // 1. Ghi nhận giao dịch Transfer vào bảng transactions
      const transferNote = note.trim()
        ? `${note.trim()} (Chuyển từ ${fromWallet.name} sang ${toWallet.name})`
        : `Chuyển từ ${fromWallet.name} sang ${toWallet.name}`;

      const { error: transError } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: numericAmount,
          type: 'transfer',
          category: 'Chuyển tiền nội bộ',
          category_icon: '🔄',
          note: transferNote,
          transaction_date: date,
          wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
        },
      ]);

      if (transError) throw transError;

      // 2. Cập nhật số dư Ví Nguồn (Trừ)
      const { error: deductError } = await supabase
        .from('wallets')
        .update({
          balance: Number(fromWallet.balance || 0) - numericAmount,
        })
        .eq('id', fromWalletId)
        .eq('user_id', user.id);

      if (deductError) throw deductError;

      // 3. Cập nhật số dư Ví Đích (Cộng)
      const { error: addError } = await supabase
        .from('wallets')
        .update({
          balance: Number(toWallet.balance || 0) + numericAmount,
        })
        .eq('id', toWalletId)
        .eq('user_id', user.id);

      if (addError) throw addError;

      showToast(`Đã chuyển ${formatVND(numericAmount)} thành công`, 'success');
      setAmountStr('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi chuyển tiền';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fromWallet = wallets.find((w) => w.id === fromWalletId);
  const toWallet = wallets.find((w) => w.id === toWalletId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Chuyển tiền nội bộ"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chuyển Tiền Nội Bộ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Không tính vào tổng chi tiêu hay thu nhập
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

            {wallets.length < 2 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-slate-400">
                  Bạn cần có ít nhất 2 ví để thực hiện chuyển tiền nội bộ.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Chọn ví nguồn & ví đích */}
                <div className="relative p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Từ Ví (Nguồn)
                    </label>
                    <select
                      value={fromWalletId}
                      onChange={(e) => setFromWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id} disabled={w.id === toWalletId}>
                          {w.icon} {w.name} (Số dư: {formatVND(Number(w.balance || 0))})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nút đảo chiều */}
                  <div className="flex justify-center -my-1">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="p-1.5 rounded-full bg-white dark:bg-[#1a1d2d] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 shadow-sm transition cursor-pointer"
                      title="Đảo chiều"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Sang Ví (Đích)
                    </label>
                    <select
                      value={toWalletId}
                      onChange={(e) => setToWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                          {w.icon} {w.name} (Số dư: {formatVND(Number(w.balance || 0))})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nhập số tiền */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Số tiền chuyển (VNĐ)
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
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-lg font-black tabular-nums text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Ghi chú & Ngày */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Ngày chuyển
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Ghi chú thêm
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Rút ATM, gửi tiết kiệm..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span>Xác nhận chuyển khoản</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
