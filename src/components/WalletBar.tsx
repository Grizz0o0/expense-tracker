'use client';

import { useState } from 'react';
import { Wallet } from '@/types/database';
import { formatVND } from '@/lib/utils';
import { Wallet as WalletIcon, Plus, ArrowRightLeft, Sparkles, ChevronRight } from 'lucide-react';

interface WalletBarProps {
  wallets: Wallet[];
  onOpenManageWallets: () => void;
  onOpenTransferModal: () => void;
}

export function WalletBar({
  wallets,
  onOpenManageWallets,
  onOpenTransferModal,
}: WalletBarProps) {
  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance || 0), 0);

  return (
    <div className="rounded-2xl fintech-card bg-white dark:bg-[#0f1118] p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.05]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <WalletIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Ví & Tài Khoản Của Tôi</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                {wallets.length} ví
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chuyển tiền nội bộ</span>
          </button>
          <button
            type="button"
            onClick={onOpenManageWallets}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition cursor-pointer"
          >
            <span>Quản lý</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Danh sách thẻ ví nằm ngang cuộn mượt */}
      {wallets.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-400">
            Chưa có ví nào được tạo.{' '}
            <button
              onClick={onOpenManageWallets}
              className="text-indigo-500 font-bold hover:underline"
            >
              Thêm ví ngay
            </button>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {wallets.map((w) => (
            <div
              key={w.id}
              onClick={onOpenManageWallets}
              className="min-w-[170px] sm:min-w-[190px] p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/15 transition cursor-pointer flex-shrink-0"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{w.icon || '💵'}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: w.color || '#10b981' }}
                />
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                {w.name}
              </div>
              <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                {formatVND(Number(w.balance || 0))}
              </div>
            </div>
          ))}

          {/* Nút thêm ví nhanh */}
          <button
            type="button"
            onClick={onOpenManageWallets}
            className="min-w-[100px] p-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 transition cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[11px] font-semibold">Thêm ví</span>
          </button>
        </div>
      )}
    </div>
  );
}
