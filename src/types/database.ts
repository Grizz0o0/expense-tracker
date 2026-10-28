export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  category_icon: string;
  note: string | null;
  transaction_date: string;
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

