'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import {
  Wallet,
  LogOut,
  ShieldCheck,
  Download,
  Plus,
  HandCoins,
  Repeat,
  Send,
  BarChart2,
} from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onExportExcel?: () => void;
  onOpenAddModal?: () => void;
  onOpenWallets?: () => void;
  onOpenDebts?: () => void;
  onOpenRecurring?: () => void;
  onOpenTelegram?: () => void;
  activeView?: 'dashboard' | 'analytics';
  onToggleView?: (view: 'dashboard' | 'analytics') => void;
}

export function Navbar({
  userEmail,
  onExportExcel,
  onOpenAddModal,
  onOpenWallets,
  onOpenDebts,
  onOpenRecurring,
  onOpenTelegram,
  activeView = 'dashboard',
  onToggleView,
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
        {/* Brand & Tab switcher */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-black text-sm tracking-tight text-slate-950 dark:text-white">
                <span>SỔ CHI TIÊU</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Zero-Trust
                </span>
              </div>
            </div>
          </div>

          {/* Switcher: Tổng quan vs Báo Cáo Analytics */}
          {onToggleView && (
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => onToggleView('dashboard')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-white dark:bg-[#1a1d2d] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tổng quan
              </button>
              <button
                type="button"
                onClick={() => onToggleView('analytics')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                  activeView === 'analytics'
                    ? 'bg-white dark:bg-[#1a1d2d] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Báo cáo</span>
              </button>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút mở Telegram Bot */}
          {onOpenTelegram && (
            <button
              onClick={onOpenTelegram}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-sky-200/80 dark:border-sky-500/20 bg-sky-50/50 dark:bg-sky-500/10 hover:bg-sky-100 text-sky-600 dark:text-sky-400 transition cursor-pointer"
              title="Trợ lý Telegram Bot"
            >
              <Send className="w-3.5 h-3.5 -rotate-45" />
              <span className="hidden md:inline">Bot Telegram</span>
            </button>
          )}

          {/* Nút mở Chi tiêu Định kỳ */}
          {onOpenRecurring && (
            <button
              onClick={onOpenRecurring}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Quản lý chi tiêu định kỳ / thuê bao"
            >
              <Repeat className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Định kỳ</span>
            </button>
          )}

          {/* Nút mở Vay - Nợ */}
          {onOpenDebts && (
            <button
              onClick={onOpenDebts}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Quản lý ví tài chính"
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Ví</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
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
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-white/[0.08]">
              <div className="hidden xl:block text-right">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
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
