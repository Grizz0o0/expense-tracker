'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Debt, DebtLog, Wallet, DebtType } from '@/types/database';
import { formatVND, toDateString, formatDateVN } from '@/lib/utils';
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Loader2,
  Trash2,
  Calendar,
  AlertCircle,
  CreditCard,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface DebtTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  wallets: Wallet[];
  onRefresh: () => void;
}

export function DebtTrackerModal({
  isOpen,
  onClose,
  debts,
  wallets,
  onRefresh,
}: DebtTrackerModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'lend' | 'borrow'>('lend');
  const [isCreating, setIsCreating] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  // Form thêm khoản nợ mới
  const [personName, setPersonName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Form trả / thu nợ từng phần
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payWalletId, setPayWalletId] = useState(wallets[0]?.id || '');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Thống kê
  const lendDebts = debts.filter((d) => d.type === 'lend');
  const borrowDebts = debts.filter((d) => d.type === 'borrow');

  const totalLendRemaining = lendDebts
    .filter((d) => d.status !== 'settled')
    .reduce((sum, d) => sum + (Number(d.initial_amount) - Number(d.paid_amount || 0)), 0);

  const totalBorrowRemaining = borrowDebts
    .filter((d) => d.status !== 'settled')
    .reduce((sum, d) => sum + (Number(d.initial_amount) - Number(d.paid_amount || 0)), 0);

  const currentList = activeTab === 'lend' ? lendDebts : borrowDebts;

  const resetCreateForm = () => {
    setPersonName('');
    setAmountStr('');
    setDueDate('');
    setNote('');
    setIsCreating(false);
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr.replace(/\D/g, ''));

    if (!personName.trim()) {
      showToast('Vui lòng nhập họ tên người mượn / người cho mượn', 'error');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      showToast('Vui lòng nhập số tiền lớn hơn 0', 'error');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      // 1. Thêm bản ghi debt
      const { data: newDebt, error: debtError } = await supabase
        .from('debts')
        .insert([
          {
            user_id: user.id,
            person_name: personName.trim(),
            type: activeTab,
            initial_amount: numericAmount,
            paid_amount: 0,
            due_date: dueDate || null,
            status: 'open',
            wallet_id: selectedWalletId || null,
            note: note.trim() || null,
          },
        ])
        .select()
        .single();

      if (debtError) throw debtError;

      // 2. Tự động cập nhật số dư ví nếu người dùng chọn ví
      if (selectedWalletId) {
        const wallet = wallets.find((w) => w.id === selectedWalletId);
        if (wallet) {
          // Nếu 'lend' (Cho vay): Tiền ví giảm đi
          // Nếu 'borrow' (Đi vay): Tiền ví tăng lên
          const balanceDiff = activeTab === 'lend' ? -numericAmount : numericAmount;
          await supabase
            .from('wallets')
            .update({ balance: Number(wallet.balance || 0) + balanceDiff })
            .eq('id', selectedWalletId)
            .eq('user_id', user.id);
        }
      }

      showToast(`Đã thêm ghi chép ${activeTab === 'lend' ? 'cho vay' : 'đi vay'} thành công`, 'success');
      resetCreateForm();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu khoản vay/nợ';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (debt: Debt) => {
    setPayingDebt(debt);
    const remaining = Number(debt.initial_amount) - Number(debt.paid_amount || 0);
    setPayAmountStr(String(Math.round(remaining)));
    setPayWalletId(wallets[0]?.id || '');
    setPayNote('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;

    const numericAmount = Number(payAmountStr.replace(/\D/g, ''));
    const remaining = Number(payingDebt.initial_amount) - Number(payingDebt.paid_amount || 0);

    if (!numericAmount || numericAmount <= 0) {
      showToast('Vui lòng nhập số tiền thanh toán', 'error');
      return;
    }

    if (numericAmount > remaining) {
      showToast('Số tiền thanh toán không được lớn hơn số còn nợ', 'error');
      return;
    }

    setPayLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      const nextPaidAmount = Number(payingDebt.paid_amount || 0) + numericAmount;
      const nextStatus = nextPaidAmount >= Number(payingDebt.initial_amount) ? 'settled' : 'partial';

      // 1. Ghi log trả nợ
      const { error: logError } = await supabase.from('debt_logs').insert([
        {
          user_id: user.id,
          debt_id: payingDebt.id,
          amount: numericAmount,
          paid_date: toDateString(new Date()),
          wallet_id: payWalletId || null,
          note: payNote.trim() || null,
        },
      ]);
      if (logError) throw logError;

      // 2. Cập nhật debts
      const { error: debtUpdateError } = await supabase
        .from('debts')
        .update({
          paid_amount: nextPaidAmount,
          status: nextStatus,
        })
        .eq('id', payingDebt.id)
        .eq('user_id', user.id);
      if (debtUpdateError) throw debtUpdateError;

      // 3. Tự động điều chỉnh số dư ví
      if (payWalletId) {
        const targetWallet = wallets.find((w) => w.id === payWalletId);
        if (targetWallet) {
          // Nếu 'lend' (Thu nợ về): Tiền ví cộng thêm (+)
          // Nếu 'borrow' (Trả nợ đi): Tiền ví bị trừ đi (-)
          const balanceDiff = payingDebt.type === 'lend' ? numericAmount : -numericAmount;
          await supabase
            .from('wallets')
            .update({ balance: Number(targetWallet.balance || 0) + balanceDiff })
            .eq('id', payWalletId)
            .eq('user_id', user.id);
        }
      }

      showToast('Ghi nhận thanh toán thành công!', 'success');
      setPayingDebt(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật thanh toán';
      showToast(msg, 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      const { error } = await supabase.from('debts').delete().eq('id', debtId);
      if (error) throw error;
      showToast('Đã xóa thành công', 'success');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa';
      showToast(msg, 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sổ theo dõi Vay và Nợ"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                  🤝
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Sổ Quản Lý Vay - Nợ
                  </h2>
                  <p className="text-xs text-slate-400">
                    Theo dõi các khoản tiền cần thu hồi hoặc cần trả
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

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div
                onClick={() => {
                  setActiveTab('lend');
                  setIsCreating(false);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  activeTab === 'lend'
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm'
                    : 'border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cần thu về (Ai nợ tôi)</span>
                </div>
                <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white mt-1">
                  {formatVND(totalLendRemaining)}
                </div>
              </div>

              <div
                onClick={() => {
                  setActiveTab('borrow');
                  setIsCreating(false);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  activeTab === 'borrow'
                    ? 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-500/10 shadow-sm'
                    : 'border-slate-100 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cần trả đi (Tôi nợ ai)</span>
                </div>
                <div className="text-base sm:text-lg font-black tabular-nums text-slate-900 dark:text-white mt-1">
                  {formatVND(totalBorrowRemaining)}
                </div>
              </div>
            </div>

            {/* Modal Thu/Trả nợ */}
            {payingDebt && (
              <div className="mt-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {payingDebt.type === 'lend' ? '📥 Ghi nhận thu nợ từ' : '📤 Ghi nhận trả nợ cho'}:{' '}
                    <span className="underline">{payingDebt.person_name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPayingDebt(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hủy
                  </button>
                </div>

                <form onSubmit={handleSubmitPayment} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Số tiền trả đợt này (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={
                          payAmountStr
                            ? new Intl.NumberFormat('vi-VN').format(Number(payAmountStr.replace(/\D/g, '')))
                            : ''
                        }
                        onChange={(e) => setPayAmountStr(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {payingDebt.type === 'lend' ? 'Cộng vào ví' : 'Trừ từ ví'}
                      </label>
                      <select
                        value={payWalletId}
                        onChange={(e) => setPayWalletId(e.target.value)}
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

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPayingDebt(null)}
                      className="px-3 py-1.5 text-xs text-slate-400"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={payLoading}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      {payLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Xác nhận</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Form thêm mới */}
            {isCreating ? (
              <form onSubmit={handleCreateDebt} className="mt-4 space-y-3.5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {activeTab === 'lend' ? 'Ghi khoản cho vay (Ai mượn tiền)' : 'Ghi khoản đi vay (Nợ ai)'}
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
                      {activeTab === 'lend' ? 'Tên người mượn' : 'Tên chủ nợ'}
                    </label>
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="Anh Tuấn, Bạn Mai..."
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Ngày hẹn thanh toán (Tùy chọn)
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {activeTab === 'lend' ? 'Tiền lấy từ ví' : 'Tiền nhận vào ví'}
                    </label>
                    <select
                      value={selectedWalletId}
                      onChange={(e) => setSelectedWalletId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="">(Không ảnh hưởng số dư ví)</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon} {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mượn đóng tiền nhà, mượn tiêu tạm..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151928] text-xs text-slate-900 dark:text-white"
                  />
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
                    <span>Lưu khoản {activeTab === 'lend' ? 'cho vay' : 'đi vay'}</span>
                  </button>
                </div>
              </form>
            ) : null}

            {/* List Header & Button Add */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {activeTab === 'lend' ? 'Danh sách người đang nợ bạn' : 'Danh sách khoản bạn đang nợ'} (
                {currentList.length})
              </span>
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{activeTab === 'lend' ? 'Cho vay mới' : 'Đi vay mới'}</span>
                </button>
              )}
            </div>

            {/* Danh sách các khoản vay nợ */}
            <div className="mt-3 space-y-2.5">
              {currentList.length === 0 ? (
                <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Không có khoản {activeTab === 'lend' ? 'cho vay' : 'đi vay'} nào
                  </p>
                </div>
              ) : (
                currentList.map((d) => {
                  const remaining = Number(d.initial_amount) - Number(d.paid_amount || 0);
                  const isSettled = d.status === 'settled';

                  return (
                    <div
                      key={d.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isSettled
                          ? 'border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] opacity-60'
                          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {d.person_name}
                            </h4>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSettled
                                  ? 'bg-slate-100 text-slate-500 dark:bg-white/5'
                                  : d.status === 'partial'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isSettled ? 'Đã hoàn tất' : d.status === 'partial' ? 'Đã trả 1 phần' : 'Chưa trả'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="text-slate-400">Còn nợ:</span>
                            <span className="font-black tabular-nums text-slate-900 dark:text-white">
                              {formatVND(remaining)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              / Gốc: {formatVND(Number(d.initial_amount))}
                            </span>
                          </div>

                          {d.due_date && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                              <Calendar className="w-3 h-3" />
                              <span>Hạn: {formatDateVN(d.due_date)}</span>
                            </div>
                          )}

                          {d.note && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">&ldquo;{d.note}&rdquo;</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {!isSettled && (
                            <button
                              type="button"
                              onClick={() => handleOpenPay(d)}
                              className="px-2.5 py-1 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                            >
                              {d.type === 'lend' ? 'Thu tiền' : 'Trả bớt'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDebt(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
