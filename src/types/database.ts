export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  category_icon: string;
  note: string | null;
  transaction_date: string;
  wallet_id?: string | null;
  to_wallet_id?: string | null; // Cho giao dịch chuyển tiền nội bộ
  created_at: string;
}

export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'credit' | 'savings' | 'other';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export const DEFAULT_WALLET_TYPES: { type: WalletType; label: string; icon: string; defaultColor: string }[] = [
  { type: 'cash', label: 'Tiền mặt', icon: '💵', defaultColor: '#10b981' },
  { type: 'bank', label: 'Tài khoản ngân hàng', icon: '🏦', defaultColor: '#3b82f6' },
  { type: 'e_wallet', label: 'Ví điện tử (Momo, ZaloPay...)', icon: '📱', defaultColor: '#ec4899' },
  { type: 'credit', label: 'Thẻ tín dụng (Credit Card)', icon: '💳', defaultColor: '#f59e0b' },
  { type: 'savings', label: 'Sổ tiết kiệm / Tích lũy', icon: '🐷', defaultColor: '#8b5cf6' },
  { type: 'other', label: 'Khác', icon: '💼', defaultColor: '#64748b' },
];

export type DebtType = 'lend' | 'borrow'; // lend: Tôi cho vay (họ nợ tôi), borrow: Tôi đi vay (tôi nợ họ)
export type DebtStatus = 'open' | 'partial' | 'settled';

export interface Debt {
  id: string;
  user_id: string;
  person_name: string;
  type: DebtType;
  initial_amount: number;
  paid_amount: number;
  due_date: string | null;
  status: DebtStatus;
  wallet_id?: string | null;
  note: string | null;
  created_at: string;
}

export interface DebtLog {
  id: string;
  user_id: string;
  debt_id: string;
  amount: number;
  paid_date: string;
  wallet_id?: string | null;
  note: string | null;
  created_at: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  category_icon: string;
  wallet_id?: string | null;
  frequency: RecurringFrequency;
  next_run_date: string;
  is_active: boolean;
  note?: string | null;
  created_at: string;
}

export interface TelegramUserLink {
  id: string;
  user_id: string;
  telegram_chat_id: string;
  telegram_username?: string | null;
  connect_code: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryOption {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: CategoryOption[] = [
  { name: 'Ăn uống', icon: '🍜', color: '#f97316' },
  { name: 'Di chuyển / Xăng xe', icon: '🚗', color: '#3b82f6' },
  { name: 'Mua sắm', icon: '🛍️', color: '#ec4899' },
  { name: 'Hóa đơn / Điện nước', icon: '💡', color: '#eab308' },
  { name: 'Nhà cửa / Sinh hoạt', icon: '🏠', color: '#10b981' },
  { name: 'Y tế / Thuốc men', icon: '💊', color: '#ef4444' },
  { name: 'Giải trí / Cà phê', icon: '☕', color: '#8b5cf6' },
  { name: 'Học tập / Phát triển', icon: '📚', color: '#06b6d4' },
  { name: 'Chi khác', icon: '📦', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryOption[] = [
  { name: 'Lương', icon: '💵', color: '#10b981' },
  { name: 'Thưởng / Phụ cấp', icon: '🎁', color: '#f59e0b' },
  { name: 'Kinh doanh / Bán hàng', icon: '💼', color: '#3b82f6' },
  { name: 'Đầu tư / Lãi tiết kiệm', icon: '📈', color: '#8b5cf6' },
  { name: 'Thu khác', icon: '💰', color: '#6366f1' },
];

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

export type TimeFilterPeriod = 'this_month' | 'last_month' | 'this_week' | 'all';
