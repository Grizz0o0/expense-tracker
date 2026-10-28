'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Transaction,
  Budget,
  TimeFilterPeriod,
  Wallet,
  Debt,
  RecurringTransaction,
} from '@/types/database';
import { isDateInPeriod, getCurrentMonthYear, getPeriodDescription } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { SummaryCards } from '@/components/SummaryCards';
import { SpendingChart } from '@/components/SpendingChart';
import { TransactionFeed } from '@/components/TransactionFeed';
import { QuickAddModal } from '@/components/QuickAddModal';
import { EditTransactionModal } from '@/components/EditTransactionModal';
import { BudgetWidget } from '@/components/BudgetWidget';
import { BudgetModal } from '@/components/BudgetModal';
import { TimeFilterBar } from '@/components/TimeFilterBar';
import { WalletBar } from '@/components/WalletBar';
import { WalletManagerModal } from '@/components/WalletManagerModal';
import { TransferModal } from '@/components/TransferModal';
import { DebtTrackerModal } from '@/components/DebtTrackerModal';
import { RecurringModal } from '@/components/RecurringModal';
import { TelegramConnectModal } from '@/components/TelegramConnectModal';
import { AnalyticsView } from '@/components/AnalyticsView';
import { exportTransactionsToExcel } from '@/components/ExportExcelModal';
import { Plus, Download, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [activeView, setActiveView] = useState<'dashboard' | 'analytics'>('dashboard');
  const [userEmail, setUserEmail] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterPeriod>('this_month');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const { month: currentMonth, year: currentYear } = useMemo(() => getCurrentMonthYear(), []);

  // 1. Fetch user, transactions, wallets, debts, recurring & current month budget
  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (transError) throw transError;
      setTransactions((transData as Transaction[]) || []);

      // 2. Fetch wallets (Nếu chưa có ví nào thì tự khởi tạo Ví Tiền Mặt)
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: true });

      if (walletError && walletError.code !== '42P01') {
        console.warn('Lỗi tải danh sách ví:', walletError);
      } else if (walletData) {
        if (walletData.length === 0) {
          const { data: newW } = await supabase
            .from('wallets')
            .insert([
              {
                user_id: user.id,
                name: 'Ví Tiền Mặt',
                type: 'cash',
                balance: 0,
                color: '#10b981',
                icon: '💵',
                is_default: true,
              },
            ])
            .select();
          if (newW) setWallets(newW as Wallet[]);
        } else {
          setWallets(walletData as Wallet[]);
        }
      }

      // 3. Fetch debts
      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!debtError && debtData) {
        setDebts(debtData as Debt[]);
      }

      // 4. Fetch recurring transactions
      const { data: recData, error: recError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_run_date', { ascending: true });

      if (!recError && recData) {
        setRecurringList(recData as RecurringTransaction[]);
      }

      // 5. Fetch current month budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('category', 'all')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (!budgetError && budgetData) {
        setBudget(budgetData as Budget);
      } else {
        setBudget(null);
      }
    } catch (err: unknown) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentMonth, currentYear]);

  useEffect(() => {
    loadData();

    // 2. Realtime listener: Cập nhật thời gian thực khi có thay đổi bất kỳ bảng nào
    const channel = supabase
      .channel('realtime_dashboard_master')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadData]);

  // 3. Keyboard shortcut: Bấm phím N để mở nhanh modal ghi chép
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter transactions theo kỳ thời gian
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInPeriod(t.transaction_date, timeFilter));
  }, [transactions, timeFilter]);

  // Tính toán Dòng tiền Thu/Chi trong kỳ (loại bỏ transfer)
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of filteredTransactions) {
      if (t.type === 'transfer') continue;
      const val = Number(t.amount);
      if (t.type === 'income') {
        income += val;
      } else {
        expense += val;
      }
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // Tính toán TÀI SẢN RÒNG (NET WORTH)
  const { netWorth, totalLend, totalBorrow } = useMemo(() => {
    const totalWalletBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
    const lend = debts
      .filter((d) => d.type === 'lend' && d.status !== 'settled')
      .reduce((sum, d) => sum + (Number(d.initial_amount) - Number(d.paid_amount || 0)), 0);
    const borrow = debts
      .filter((d) => d.type === 'borrow' && d.status !== 'settled')
      .reduce((sum, d) => sum + (Number(d.initial_amount) - Number(d.paid_amount || 0)), 0);

    return {
      netWorth: totalWalletBalance + lend - borrow,
      totalLend: lend,
      totalBorrow: borrow,
    };
  }, [wallets, debts]);

  // Current month total expense cho Budget Widget
  const currentMonthExpense = useMemo(() => {
    let sum = 0;
    const refDate = new Date(currentYear, currentMonth - 1, 15);
    for (const t of transactions) {
      if (t.type === 'expense' && isDateInPeriod(t.transaction_date, 'this_month', refDate)) {
        sum += Number(t.amount);
      }
    }
    return sum;
  }, [transactions, currentMonth, currentYear]);

  // Sửa giao dịch
  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsEditModalOpen(true);
  };

  const handleTransactionUpdated = (updated: Transaction) => {
    setTransactions((prev) => {
      const next = prev.map((item) => (item.id === updated.id ? updated : item));
      return next.sort((a, b) => {
        if (b.transaction_date !== a.transaction_date) {
          return b.transaction_date.localeCompare(a.transaction_date);
        }
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
    });
    loadData();
  };

  const handleBudgetUpdated = (savedBudget: Budget | null) => {
    setBudget(savedBudget);
  };

  const handleExport = () => {
    exportTransactionsToExcel(filteredTransactions);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 sm:pb-12">
      <Navbar
        userEmail={userEmail}
        onExportExcel={handleExport}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenWallets={() => setIsWalletModalOpen(true)}
        onOpenDebts={() => setIsDebtModalOpen(true)}
        onOpenRecurring={() => setIsRecurringModalOpen(true)}
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
        activeView={activeView}
        onToggleView={setActiveView}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-5">
        {activeView === 'analytics' ? (
          /* MÀN HÌNH BÁO CÁO TÀI CHÍNH SÂU & XU HƯỚNG */
          <AnalyticsView
            transactions={transactions}
            wallets={wallets}
            debts={debts}
          />
        ) : (
          /* MÀN HÌNH DASHBOARD TỔNG QUAN CHÍNH */
          <>
            {/* Top Header & Fast Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                  <span>Tổng quan tài chính</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hệ thống quản lý tài sản, đa ví & trợ lý tài chính thông minh
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleExport}
                  className="sm:hidden px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Ghi chép mới</span>
                  <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700 rounded border border-indigo-400/30">
                    N
                  </kbd>
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2.5" />
                <p className="text-xs font-medium">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* Thanh Quản Lý Đa Ví Nhanh */}
                <WalletBar
                  wallets={wallets}
                  onOpenManageWallets={() => setIsWalletModalOpen(true)}
                  onOpenTransferModal={() => setIsTransferModalOpen(true)}
                />

                {/* Time Filter Bar */}
                <TimeFilterBar
                  currentFilter={timeFilter}
                  onFilterChange={setTimeFilter}
                  transactionCount={filteredTransactions.length}
                />

                {/* 1. Summary Cards (Net Worth + Cash Flow + In/Out) */}
                <SummaryCards
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  balance={balance}
                  periodLabel={getPeriodDescription(timeFilter).label}
                  netWorth={netWorth}
                  totalDebtsLend={totalLend}
                  totalDebtsBorrow={totalBorrow}
                  onOpenDebts={() => setIsDebtModalOpen(true)}
                />

                {/* 2. Monthly Budget Widget */}
                <BudgetWidget
                  budget={budget}
                  currentMonthExpense={currentMonthExpense}
                  month={currentMonth}
                  year={currentYear}
                  onOpenModal={() => setIsBudgetModalOpen(true)}
                />

                {/* 2-Column Section: Spending Chart + Transaction Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Spending Donut Chart */}
                  <div className="lg:col-span-5 space-y-4">
                    <SpendingChart transactions={filteredTransactions} />
                  </div>

                  {/* Transaction Feed */}
                  <div className="lg:col-span-7">
                    <TransactionFeed
                      transactions={filteredTransactions}
                      wallets={wallets}
                      onDeleted={loadData}
                      onEditTransaction={handleOpenEdit}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button on Mobile */}
      <div className="fixed bottom-6 right-5 sm:hidden z-20">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-13 h-13 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition cursor-pointer"
          aria-label="Ghi chép giao dịch mới"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Quick Add Modal (Hỗ trợ AI Voice/NLP, Chọn Ví & AI OCR Scan Bill) */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
        wallets={wallets}
      />

      {/* Modal Quản lý Đa Ví */}
      <WalletManagerModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallets={wallets}
        onRefresh={loadData}
      />

      {/* Modal Chuyển Tiền Nội Bộ */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onSuccess={loadData}
      />

      {/* Modal Sổ Vay - Nợ */}
      <DebtTrackerModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debts={debts}
        wallets={wallets}
        onRefresh={loadData}
      />

      {/* Modal Chi tiêu Định kỳ / Thuê bao */}
      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        recurringList={recurringList}
        wallets={wallets}
        onRefresh={loadData}
      />

      {/* Modal Kết nối Telegram Bot */}
      <TelegramConnectModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />

      {/* Sửa giao dịch */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        transaction={editingTransaction}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionUpdated}
      />

      {/* Ngân sách */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={budget}
        month={currentMonth}
        year={currentYear}
        currentMonthExpense={currentMonthExpense}
        onSuccess={handleBudgetUpdated}
      />
    </div>
  );
}
