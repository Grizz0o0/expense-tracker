'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, WalletType, DEFAULT_WALLET_TYPES } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { X, Plus, Trash2, Edit2, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface WalletManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onRefresh: () => void;
}

export function WalletManagerModal({
  isOpen,
  onClose,
  wallets,
  onRefresh,
}: WalletManagerModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balanceStr, setBalanceStr] = useState('0');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('💵');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setType('cash');
    setBalanceStr('0');
    setColor('#10b981');
    setIcon('💵');
    setIsCreating(false);
    setEditingWallet(null);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsCreating(false);
    setName(wallet.name);
    setType(wallet.type);
    setBalanceStr(String(Math.round(wallet.balance)));
    setColor(wallet.color || '#10b981');
    setIcon(wallet.icon || '💵');
  };

  const handleTypeSelect = (selectedType: WalletType) => {
    setType(selectedType);
    const preset = DEFAULT_WALLET_TYPES.find((t) => t.type === selectedType);
    if (preset) {
      setIcon(preset.icon);
      setColor(preset.defaultColor);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên ví', 'error');
      return;
    }

    const numericBalance = Number(balanceStr.replace(/\D/g, '')) || 0;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn');

      if (editingWallet) {
        // Update
        const { error } = await supabase
          .from('wallets')
          .update({
            name: name.trim(),
            type,
            balance: numericBalance,
            color,
            icon,
          })
          .eq('id', editingWallet.id)
          .eq('user_id', user.id);

        if (error) throw error;
        showToast('Đã cập nhật ví thành công', 'success');
      } else {
        // Insert
        const isDefault = wallets.length === 0;
        const { error } = await supabase.from('wallets').insert([
          {
            user_id: user.id,
            name: name.trim(),
            type,
            balance: numericBalance,
            color,
            icon,
            is_default: isDefault,
          },
        ]);

        if (error) throw error;
        showToast('Đã tạo ví mới thành công', 'success');
      }

      resetForm();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu ví';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (walletId: string, walletName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ví "${walletName}"? Các giao dịch liên quan sẽ được giữ nguyên.`)) {
      return;
    }

    setDeletingId(walletId);
    try {
      const { error } = await supabase.from('wallets').delete().eq('id', walletId);
      if (error) throw error;
      showToast('Đã xóa ví thành công', 'success');
      if (editingWallet?.id === walletId) resetForm();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa ví';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalAllWallets = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quản lý ví tài chính"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                  💼
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Quản Lý Danh Sách Ví
                  </h2>
                  <p className="text-xs text-slate-400">
                    Tổng tài sản các ví: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(totalAllWallets)}</span>
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

            {/* Content: Form Create/Edit or List */}
            {isCreating || editingWallet ? (
              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {editingWallet ? 'Chỉnh sửa ví' : 'Thêm ví tài chính mới'}
                  </span>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white underline cursor-pointer"
                  >
                    Quay lại danh sách
                  </button>
                </div>

                {/* Chọn loại ví */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Loại tài khoản
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEFAULT_WALLET_TYPES.map((t) => (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => handleTypeSelect(t.type)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-left border text-xs font-medium transition cursor-pointer ${
                          type === t.type
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tên ví */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Ví Tiền Mặt, VCB Chi Tiêu, Momo..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Số dư ban đầu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Số dư hiện tại (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={
                      balanceStr
                        ? new Intl.NumberFormat('vi-VN').format(Number(balanceStr.replace(/\D/g, '')))
                        : '0'
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setBalanceStr(digits || '0');
                    }}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-base font-bold tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Biểu tượng & Màu sắc */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Biểu tượng Emoji
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full text-center px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Màu đại diện
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-500">{color}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span>{editingWallet ? 'Lưu thay đổi' : 'Tạo ví ngay'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Danh sách ví hiện có */
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách tài khoản ({wallets.length})
                  </span>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Thêm ví mới</span>
                  </button>
                </div>

                {wallets.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Chưa có ví nào được tạo
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Bấm &quot;Thêm ví mới&quot; để tạo ví Tiền mặt hoặc Tài khoản ngân hàng đầu tiên của bạn.
                    </p>
                    <button
                      type="button"
                      onClick={startCreate}
                      className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      Tạo Ví Tiền Mặt Mặc Định
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {wallets.map((w) => (
                      <div
                        key={w.id}
                        className="relative p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between group hover:border-slate-300 dark:hover:border-white/15 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                            style={{ backgroundColor: `${w.color || '#6366f1'}20`, color: w.color || '#6366f1' }}
                          >
                            {w.icon || '💵'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {w.name}
                              </h4>
                              {w.is_default && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500">
                                  Chính
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-black tabular-nums text-slate-700 dark:text-slate-300 mt-0.5">
                              {formatVND(Number(w.balance || 0))}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => startEdit(w)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
                            title="Sửa ví"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === w.id}
                            onClick={() => handleDelete(w.id, w.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Xóa ví"
                          >
                            {deletingId === w.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
