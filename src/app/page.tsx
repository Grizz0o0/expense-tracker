'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Budget, TimeFilterPeriod } from '@/types/database';
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
import { exportTransactionsToExcel } from '@/components/ExportExcelModal';
import { Plus, Download, Sparkles, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [userEmail, setUserEmail] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterPeriod>('this_month');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const { month: currentMonth, year: currentYear } = useMemo(() => getCurrentMonthYear(), []);

  // 1. Fetch user, transactions & current month budget
  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }

      // Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (transError) throw transError;
      setTransactions((transData as Transaction[]) || []);

      // Fetch current month budget
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

    // 2. Realtime listener: Cập nhật thời gian thực khi có thay đổi transactions hoặc budgets
    const channel = supabase
      .channel('realtime_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => {
          loadData();
        }
      )
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

  // Filter transactions according to selected time period (R3)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInPeriod(t.transaction_date, timeFilter));
  }, [transactions, timeFilter]);

  // Compute metrics for the active time filter (KPI Cards)
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const t of filteredTransactions) {
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

  // Current month total expense specifically for Monthly Budget Widget (R2)
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

  // Handle transaction editing (R1)
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
  };

  const handleBudgetUpdated = (savedBudget: Budget | null) => {
    setBudget(savedBudget);
  };

  const handleExport = () => {
    exportTransactionsToExcel(filteredTransactions);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 sm:pb-12">
      <Navbar userEmail={userEmail} onExportExcel={handleExport} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 sm:py-7 space-y-5">
        {/* Top greeting & Quick actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>SỔ TÀI CHÍNH CÁ NHÂN</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toàn bộ dữ liệu của bạn được cô lập và bảo vệ bằng PostgreSQL RLS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="sm:hidden px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Excel
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>GHI CHÉP MỚI</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-indigo-700 rounded border border-indigo-400/40">
                N
              </kbd>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs">Đang đồng bộ dữ liệu thời gian thực...</p>
          </div>
        ) : (
          <>
            {/* R3. Time Filter Bar */}
            <TimeFilterBar
              currentFilter={timeFilter}
              onFilterChange={setTimeFilter}
              transactionCount={filteredTransactions.length}
            />

            {/* 1. Summary Cards (Synced with Time Filter) */}
            <SummaryCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              periodLabel={getPeriodDescription(timeFilter).label}
            />

            {/* R2. Monthly Budget Widget */}
            <BudgetWidget
              budget={budget}
              currentMonthExpense={currentMonthExpense}
              month={currentMonth}
              year={currentYear}
              onOpenModal={() => setIsBudgetModalOpen(true)}
            />

            {/* 2. Main Grid: Analytics & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Spending Donut Chart (Synced with Time Filter) */}
              <div className="lg:col-span-5 order-2 lg:order-1">
                <SpendingChart transactions={filteredTransactions} />
              </div>

              {/* Transactions Feed (Synced with Time Filter & Edit Modal) */}
              <div className="lg:col-span-7 order-1 lg:order-2">
                <TransactionFeed
                  transactions={filteredTransactions}
                  onDeleted={loadData}
                  onEditTransaction={handleOpenEdit}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-95 transition cursor-pointer"
          aria-label="Thêm chi tiêu nhanh"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      {/* R1. Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSuccess={handleTransactionUpdated}
      />

      {/* R2. Monthly Budget Modal */}
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
