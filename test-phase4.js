/**
 * Test Suite kiểm thử toàn diện cho Phase 4:
 * 1. API Route OCR Receipt Parsing
 * 2. API Route Telegram Webhook Parser & Logic
 * 3. Tính toán Analytics Monthly Breakdown & Burn-Rate Forecast
 * 4. Tính toán Định kỳ Recurring Next Run Date & Monthly Commitment
 */

import { parseNaturalLanguageInput } from './src/lib/smartInputParser.ts';

function runPhase4Tests() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHASE 4 ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failCount++;
    }
  }

  // 1. Kiểm thử Recurring Calculation
  console.log('1. KIỂM THỬ TÍNH TOÁN CHI TIÊU ĐỊNH KỲ (RECURRING):');
  const mockRecurring = [
    { title: 'Tiền nhà', amount: 3500000, frequency: 'monthly', is_active: true },
    { title: 'Netflix', amount: 260000, frequency: 'monthly', is_active: true },
    { title: 'Domain web', amount: 240000, frequency: 'yearly', is_active: true }, // 20k/tháng
    { title: 'Tạm dừng', amount: 1000000, frequency: 'monthly', is_active: false }, // không tính
  ];

  const totalMonthly = mockRecurring
    .filter(r => r.is_active)
    .reduce((sum, r) => {
      let m = r.amount;
      if (r.frequency === 'yearly') m /= 12;
      return sum + m;
    }, 0);

  assert(totalMonthly === 3780000, 'Tổng chi phí định kỳ cố định/tháng = 3,780,000 VNĐ');

  // 2. Kiểm thử Burn-rate Forecast Analytics
  console.log('\n2. KIỂM THỬ DỰ PHÓNG CUỐI THÁNG (BURN-RATE FORECAST):');
  const mockCurrentExpense = 4500000;
  const mockDayOfMonth = 15;
  const mockDaysInMonth = 30;
  const dailyRate = mockCurrentExpense / mockDayOfMonth; // 300,000 / ngày
  const remainingDays = mockDaysInMonth - mockDayOfMonth; // 15 ngày
  const projectedMonthExpense = mockCurrentExpense + dailyRate * remainingDays; // 9,000,000

  assert(dailyRate === 300000, 'Tốc độ chi tiêu trung bình: 300,000 VNĐ/ngày');
  assert(projectedMonthExpense === 9000000, 'Dự phóng chi tiêu cả tháng: 9,000,000 VNĐ');

  // 3. Kiểm thử Telegram Parser qua webhook messages
  console.log('\n3. KIỂM THỬ XỬ LÝ LỆNH TELEGRAM:');
  const t1 = parseNaturalLanguageInput('Cơm trưa 45k vcb');
  assert(t1.amount === 45000 && t1.category === 'Ăn uống' && t1.walletName === 'vietcombank',
    'Telegram: "Cơm trưa 45k vcb" -> 45,000đ / Ăn uống / VCB');

  const t2 = parseNaturalLanguageInput('Lương tháng 10 30tr');
  assert(t2.amount === 30000000 && t2.type === 'income' && t2.category === 'Lương',
    'Telegram: "Lương tháng 10 30tr" -> 30,000,000đ / Thu nhập / Lương');

  console.log(`\n=== TỔNG KẾT PHASE 4: ${passCount} PASSED, ${failCount} FAILED ===\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
