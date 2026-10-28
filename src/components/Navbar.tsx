'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  onExportExcel?: () => void;
}

export function Navbar({ userEmail, onExportExcel }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#08090d]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              <span>SỔ CHI TIÊU</span>
              <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Riêng tư
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block">
              Bảo mật Zero-Trust RLS
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              📊 Xuất Excel
            </button>
          )}

          <ThemeToggle />

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
            <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[130px] sm:max-w-[180px] truncate hidden md:inline-block">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition cursor-pointer border border-transparent hover:border-rose-500/20"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
