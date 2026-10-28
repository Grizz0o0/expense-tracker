'use client';

import * as XLSX from 'xlsx';
import { Transaction } from '@/types/database';

export function exportTransactionsToExcel(transactions: Transaction[]) {
  if (!transactions.length) {
    alert('Không có giao dịch nào để xuất file');
    return;
  }

  const rows = transactions.map((t, index) => ({
    STT: index + 1,
    'Ngày giao dịch': t.transaction_date,
    'Loại': t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập',
    'Danh mục': t.category,
    'Số tiền (VNĐ)': Number(t.amount),
    'Ghi chú': t.note || '',
    'Thời gian ghi': new Date(t.created_at).toLocaleString('vi-VN'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chi Tiêu');

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `So_Chi_Tieu_${dateStr}.xlsx`);
}
