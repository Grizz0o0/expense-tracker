'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Wallet, LogOut, ShieldCheck, Download, Plus, HandCoins } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onExportExcel?: () => void;
  onOpenAddModal?: () => void;
  onOpenWallets?: () => void;
  onOpenDebts?: () => void;
}

export function Navbar({
  userEmail,
  onExportExcel,
  onOpenAddModal,
  onOpenWallets,
  onOpenDebts,
}: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-black text-sm tracking-tight text-slate-950 dark:text-white">
              <span>SỔ CHI TIÊU</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Zero-Trust
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Quản lý tài chính cá nhân & Đa ví thông minh
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Nút mở Vay - Nợ */}
          {onOpenDebts && (
            <button
              onClick={onOpenDebts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Sổ theo dõi Vay - Nợ"
            >
              <HandCoins className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Vay - Nợ</span>
            </button>
          )}

          {/* Nút mở Ví */}
          {onOpenWallets && (
            <button
              onClick={onOpenWallets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Quản lý ví tài chính"
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Ví tiền</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          )}

          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="sm:hidden px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ghi</span>
            </button>
          )}

          {/* Theme switch */}
          <ThemeToggle />

          {/* User info & Logout */}
          {userEmail && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-white/[0.08]">
              <div className="hidden lg:block text-right">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[130px] truncate">
                  {userEmail}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
