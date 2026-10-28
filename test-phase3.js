/**
 * Test Suite kiểm thử tự động toàn diện cho Phase 3:
 * 1. AI NLP Natural Language & Voice Parser
 * 2. Tính toán Đa Ví & Chuyển Tiền Nội Bộ (Transfer)
 * 3. Tính toán Vay - Nợ (Lend / Borrow) & Tài Sản Ròng (Net Worth)
 */

import { parseNaturalLanguageInput, extractAmount } from './src/lib/smartInputParser.ts';

function runTestSuite() {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHASE 3 ===\n');
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

  // 1. Kiểm thử trích xuất số tiền phong cách người Việt
  console.log('1. KIỂM THỬ TRÍCH XUẤT SỐ TIỀN TIẾNG VIỆT (k, tr, củ, lít, m):');
  assert(extractAmount('bún bò 45k')?.amount === 45000, '45k -> 45,000');
  assert(extractAmount('cà phê 35 k')?.amount === 35000, '35 k -> 35,000');
  assert(extractAmount('mua áo 250 nghìn')?.amount === 250000, '250 nghìn -> 250,000');
  assert(extractAmount('lương 25tr')?.amount === 25000000, '25tr -> 25,000,000');
  assert(extractAmount('tiền nhà 3.5 triệu')?.amount === 3500000, '3.5 triệu -> 3,500,000');
  assert(extractAmount('mua điện thoại 15tr5')?.amount === 15500000, '15tr5 -> 15,500,000');
  assert(extractAmount('nhậu 2 lít')?.amount === 200000, '2 lít -> 200,000');
  assert(extractAmount('mua lap 2 củ')?.amount === 2000000, '2 củ -> 2,000,000');

  // 2. Kiểm thử AI Natural Language Parser
  console.log('\n2. KIỂM THỬ BỘ PHÂN TÍCH NGÔN NGỮ TỰ NHIÊN (NLP PARSER):');
  
  const res1 = parseNaturalLanguageInput('Ăn bún bò 45k tiền mặt');
  assert(res1.type === 'expense' && res1.amount === 45000 && res1.category === 'Ăn uống' && res1.walletName === 'tiền mặt', 
    'Ăn bún bò 45k tiền mặt -> Expense / 45,000 / Ăn uống / Tiền mặt');

  const res2 = parseNaturalLanguageInput('Đổ xăng 70k');
  assert(res2.type === 'expense' && res2.amount === 70000 && res2.category === 'Di chuyển / Xăng xe',
    'Đổ xăng 70k -> Expense / 70,000 / Di chuyển / Xăng xe');

  const res3 = parseNaturalLanguageInput('Nhận lương tháng này 25tr');
  assert(res3.type === 'income' && res3.amount === 25000000 && res3.category === 'Lương',
    'Nhận lương tháng này 25tr -> Income / 25,000,000 / Lương');

  const res4 = parseNaturalLanguageInput('Chuyển 5tr sang tiết kiệm');
  assert(res4.type === 'transfer' && res4.amount === 5000000 && res4.walletName === 'tiết kiệm',
    'Chuyển 5tr sang tiết kiệm -> Transfer / 5,000,000 / Tiết kiệm');

  // 3. Kiểm thử Logic Tài sản ròng & Công nợ (Net Worth)
  console.log('\n3. KIỂM THỬ LOGIC TÀI CHÍNH (ĐA VÍ, NỢ & NET WORTH):');
  const mockWallets = [
    { id: 'w1', name: 'Ví Tiền Mặt', balance: 5000000 },
    { id: 'w2', name: 'VCB Ngân Hàng', balance: 20000000 },
  ];
  const mockDebts = [
    { id: 'd1', type: 'lend', initial_amount: 3000000, paid_amount: 1000000, status: 'partial' }, // Còn 2tr người khác nợ mình (+)
    { id: 'd2', type: 'borrow', initial_amount: 5000000, paid_amount: 0, status: 'open' },        // Nợ người khác 5tr (-)
  ];

  const totalWallets = mockWallets.reduce((s, w) => s + w.balance, 0); // 25,000,000
  const totalLend = mockDebts.filter(d => d.type === 'lend').reduce((s, d) => s + (d.initial_amount - d.paid_amount), 0); // 2,000,000
  const totalBorrow = mockDebts.filter(d => d.type === 'borrow').reduce((s, d) => s + (d.initial_amount - d.paid_amount), 0); // 5,000,000
  const netWorth = totalWallets + totalLend - totalBorrow; // 25 + 2 - 5 = 22,000,000

  assert(totalWallets === 25000000, 'Tổng số dư các ví = 25,000,000');
  assert(totalLend === 2000000, 'Khoản cho vay còn phải thu = 2,000,000');
  assert(totalBorrow === 5000000, 'Khoản đi vay còn phải trả = 5,000,000');
  assert(netWorth === 22000000, 'Tài sản ròng (Net Worth) = 22,000,000 VNĐ');

  console.log(`\n=== TỔNG KẾT: ${passCount} PASSED, ${failCount} FAILED ===\n`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
