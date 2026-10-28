import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TimeFilterPeriod } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  return `${formatted} vnđ`;
}

export function formatCompactVND(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Tỷ vnđ`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} Tr vnđ`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k vnđ`;
  }
  return `${amount} vnđ`;
}

export function formatDateVN(dateString: string): string {
  if (!dateString) return '';
  const dateOnly = dateString.includes('T') ? dateString.split('T')[0] : dateString.trim();
  const parts = dateOnly.split('-');
  let date: Date;

  if (
    parts.length === 3 &&
    !isNaN(Number(parts[0])) &&
    !isNaN(Number(parts[1])) &&
    !isNaN(Number(parts[2]))
  ) {
    date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hôm nay';
  if (isYesterday) return 'Hôm qua';

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthYear(refDate: Date = new Date()): { month: number; year: number } {
  return {
    month: refDate.getMonth() + 1,
    year: refDate.getFullYear(),
  };
}

export function isDateInPeriod(
  dateStr: string,
  period: TimeFilterPeriod,
  refDate: Date = new Date()
): boolean {
  if (period === 'all') return true;
  if (!dateStr) return false;

  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return false;
  const [tYear, tMonth, tDay] = parts.map(Number);
  if (isNaN(tYear) || isNaN(tMonth) || isNaN(tDay)) return false;
  if (tMonth < 1 || tMonth > 12 || tDay < 1 || tDay > 31) return false;

  const cleanDateStr = `${tYear}-${String(tMonth).padStart(2, '0')}-${String(tDay).padStart(2, '0')}`;

  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth() + 1;

  if (period === 'this_month') {
    return tYear === currentYear && tMonth === currentMonth;
  }

  if (period === 'last_month') {
    const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return tYear === targetYear && tMonth === targetMonth;
  }

  if (period === 'this_week') {
    const day = refDate.getDay();
    // Monday is first day of week (day=1 -> diff 0, day=0 (Sun) -> diff 6)
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - diffToMonday);
    const sunday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - diffToMonday + 6);

    const mondayStr = toDateString(monday);
    const sundayStr = toDateString(sunday);

    return cleanDateStr >= mondayStr && cleanDateStr <= sundayStr;
  }

  return true;
}

export function getPeriodDescription(
  period: TimeFilterPeriod,
  refDate: Date = new Date()
): { label: string; dateRange: string } {
  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth() + 1;

  switch (period) {
    case 'this_month': {
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      return {
        label: 'Tháng này',
        dateRange: `01/${String(currentMonth).padStart(2, '0')} - ${lastDay}/${String(currentMonth).padStart(2, '0')}/${currentYear}`,
      };
    }
    case 'last_month': {
      const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      return {
        label: 'Tháng trước',
        dateRange: `01/${String(targetMonth).padStart(2, '0')} - ${lastDay}/${String(targetMonth).padStart(2, '0')}/${targetYear}`,
      };
    }
    case 'this_week': {
      const day = refDate.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - diffToMonday);
      const sunday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - diffToMonday + 6);
      const mYear = monday.getFullYear() !== sunday.getFullYear() ? `/${monday.getFullYear()}` : '';
      const mStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}${mYear}`;
      const sStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;
      return {
        label: 'Tuần này',
        dateRange: `${mStr} - ${sStr}`,
      };
    }
    case 'all':
    default:
      return {
        label: 'Tất cả',
        dateRange: 'Toàn bộ thời gian',
      };
  }
}

