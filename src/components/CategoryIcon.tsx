import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Home,
  HeartPulse,
  Coffee,
  GraduationCap,
  Package,
  Banknote,
  Gift,
  Briefcase,
  TrendingUp,
  Coins,
  Receipt,
  LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, { icon: LucideIcon; color: string; bgLight: string; bgDark: string }> = {
  // Expenses
  'Ăn uống': { icon: Utensils, color: '#f97316', bgLight: '#ffedd5', bgDark: 'rgba(249, 115, 22, 0.15)' },
  'Di chuyển / Xăng xe': { icon: Car, color: '#3b82f6', bgLight: '#dbeafe', bgDark: 'rgba(59, 130, 246, 0.15)' },
  'Mua sắm': { icon: ShoppingBag, color: '#ec4899', bgLight: '#fce7f3', bgDark: 'rgba(236, 72, 153, 0.15)' },
  'Hóa đơn / Điện nước': { icon: Zap, color: '#eab308', bgLight: '#fef9c3', bgDark: 'rgba(234, 179, 8, 0.15)' },
  'Nhà cửa / Sinh hoạt': { icon: Home, color: '#10b981', bgLight: '#d1fae5', bgDark: 'rgba(16, 185, 129, 0.15)' },
  'Y tế / Thuốc men': { icon: HeartPulse, color: '#ef4444', bgLight: '#fee2e2', bgDark: 'rgba(239, 68, 68, 0.15)' },
  'Giải trí / Cà phê': { icon: Coffee, color: '#8b5cf6', bgLight: '#ede9fe', bgDark: 'rgba(139, 92, 246, 0.15)' },
  'Học tập / Phát triển': { icon: GraduationCap, color: '#06b6d4', bgLight: '#cffafe', bgDark: 'rgba(6, 182, 212, 0.15)' },
  'Chi khác': { icon: Package, color: '#64748b', bgLight: '#f1f5f9', bgDark: 'rgba(100, 116, 139, 0.15)' },

  // Income
  'Lương': { icon: Banknote, color: '#10b981', bgLight: '#d1fae5', bgDark: 'rgba(16, 185, 129, 0.15)' },
  'Thưởng / Phụ cấp': { icon: Gift, color: '#f59e0b', bgLight: '#fef3c7', bgDark: 'rgba(245, 158, 11, 0.15)' },
  'Kinh doanh / Bán hàng': { icon: Briefcase, color: '#3b82f6', bgLight: '#dbeafe', bgDark: 'rgba(59, 130, 246, 0.15)' },
  'Đầu tư / Lãi tiết kiệm': { icon: TrendingUp, color: '#8b5cf6', bgLight: '#ede9fe', bgDark: 'rgba(139, 92, 246, 0.15)' },
  'Thu khác': { icon: Coins, color: '#6366f1', bgLight: '#e0e7ff', bgDark: 'rgba(99, 102, 241, 0.15)' },
};

export function CategoryBadge({
  category,
  size = 'md',
  showLabel = false,
  className = '',
}: {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const config = CATEGORY_ICON_MAP[category] || {
    icon: Receipt,
    color: '#6366f1',
    bgLight: '#e0e7ff',
    bgDark: 'rgba(99, 102, 241, 0.15)',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses} rounded-xl flex items-center justify-center shrink-0 transition-transform`}
        style={{
          backgroundColor: config.bgDark,
          color: config.color,
          boxShadow: `0 0 0 1px ${config.color}20`,
        }}
      >
        <Icon className={iconSizes} strokeWidth={2.2} />
      </div>
      {showLabel && (
        <span className="font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
          {category}
        </span>
      )}
    </div>
  );
}
