export interface ParsedSmartInput {
  amount?: number;
  type?: 'expense' | 'income' | 'transfer';
  category?: string;
  categoryIcon?: string;
  note?: string;
  walletName?: string;
  toWalletName?: string;
  rawText: string;
}

// Bảng từ khóa danh mục chi tiêu / thu nhập thường gặp
const CATEGORY_KEYWORDS: {
  keywords: string[];
  name: string;
  icon: string;
  type: 'expense' | 'income';
}[] = [
  // Giải trí / Cà phê
  {
    keywords: [
      'cà phê', 'cafe', 'cf', 'coffee', 'starbucks', 'highlands', 'phúc long', 
      'xem phim', 'cinema', 'game', 'bida', 'karaoke', 'hát', 'du lịch', 'vé'
    ],
    name: 'Giải trí / Cà phê',
    icon: '☕',
    type: 'expense',
  },
  // Ăn uống
  {
    keywords: [
      'cơm', 'bún', 'phở', 'bánh mì', 'trưa', 'tối', 'sáng', 'lẩu', 'nướng', 
      'nhậu', 'pizza', 'mì', 'chè', 'đồ ăn', 'takeaway', 'food', 'snack', 'trà sữa', 
      'trasua', 'uống', 'ăn'
    ],
    name: 'Ăn uống',
    icon: '🍜',
    type: 'expense',
  },
  // Di chuyển / Xăng xe
  {
    keywords: [
      'xăng', 'đổ xăng', 'grab', 'be', 'gojek', 'taxi', 'gửi xe', 'rửa xe', 
      'sửa xe', 'thay nhớt', 'vé xe', 'tàu', 'máy bay', 'phí cầu đường', 'bot'
    ],
    name: 'Di chuyển / Xăng xe',
    icon: '🚗',
    type: 'expense',
  },
  // Mua sắm
  {
    keywords: [
      'mua', 'shopee', 'lazada', 'tiki', 'tiktok shop', 'quần áo', 'giày', 
      'áo', 'quần', 'mỹ phẩm', 'đồ điện tử', 'siêu thị', 'mart', 'vinmart', 
      'coopmart', 'bách hóa', 'chợ'
    ],
    name: 'Mua sắm',
    icon: '🛍️',
    type: 'expense',
  },
  // Hóa đơn / Điện nước
  {
    keywords: [
      'tiền điện', 'điện', 'tiền nước', 'nước', 'tiền mạng', 'wifi', 'internet', 
      '4g', 'nạp đt', 'nạp điện thoại', 'thuê nhà', 'tiền phòng', 'hóa đơn'
    ],
    name: 'Hóa đơn / Điện nước',
    icon: '💡',
    type: 'expense',
  },
  // Y tế / Thuốc men
  {
    keywords: ['thuốc', 'nhà thuốc', 'bệnh viện', 'khám', 'bác sĩ', 'nha khoa', 'răng', 'tiêm'],
    name: 'Y tế / Thuốc men',
    icon: '💊',
    type: 'expense',
  },
  // Nhà cửa / Sinh hoạt
  {
    keywords: ['sửa nhà', 'nội thất', 'gas', 'bình gas', 'nước giặt', 'giấy', 'đồ gia dụng'],
    name: 'Nhà cửa / Sinh hoạt',
    icon: '🏠',
    type: 'expense',
  },
  // Học tập / Phát triển
  {
    keywords: ['sách', 'học phí', 'khóa học', 'course', 'thi', 'chứng chỉ', 'tài liệu'],
    name: 'Học tập / Phát triển',
    icon: '📚',
    type: 'expense',
  },
  // THU NHẬP
  {
    keywords: ['lương', 'salary', 'nhận lương', 'ting ting lương'],
    name: 'Lương',
    icon: '💵',
    type: 'income',
  },
  {
    keywords: ['thưởng', 'bonus', 'phụ cấp', 'lì xì', 'quà tặng tiền'],
    name: 'Thưởng / Phụ cấp',
    icon: '🎁',
    type: 'income',
  },
  {
    keywords: ['bán hàng', 'khách trả', 'doanh thu', 'tiền hàng', 'lãi bán'],
    name: 'Kinh doanh / Bán hàng',
    icon: '💼',
    type: 'income',
  },
  {
    keywords: ['lãi', 'tiết kiệm', 'cổ tức', 'lãi đầu tư', 'chứng khoán', 'crypto'],
    name: 'Đầu tư / Lãi tiết kiệm',
    icon: '📈',
    type: 'income',
  },
];

const WALLET_KEYWORDS: { keywords: string[]; nameFragment: string }[] = [
  { keywords: ['tiền mặt', 'tien mat', 'cash', 'ví mặt'], nameFragment: 'tiền mặt' },
  { keywords: ['vietcombank', 'vcb'], nameFragment: 'vietcombank' },
  { keywords: ['techcombank', 'tcb'], nameFragment: 'techcombank' },
  { keywords: ['momo', 'ví momo'], nameFragment: 'momo' },
  { keywords: ['zalopay', 'zalo pay'], nameFragment: 'zalopay' },
  { keywords: ['mb', 'mbbank'], nameFragment: 'mbbank' },
  { keywords: ['tiết kiệm', 'tiet kiem', 'savings'], nameFragment: 'tiết kiệm' },
  { keywords: ['thẻ tín dụng', 'credit', 'visa', 'mastercard'], nameFragment: 'tín dụng' },
  { keywords: ['ngân hàng', 'ck', 'chuyển khoản', 'bank'], nameFragment: 'ngân hàng' },
];

/**
 * Trích xuất số tiền từ chuỗi ngôn ngữ tự nhiên
 * Hỗ trợ: "45k", "150k", "1.5tr", "2tr5", "2,5 triệu", "3 củ", "2 lít", "500000", "500.000"
 */
export function extractAmount(text: string): { amount: number; matchedStr: string } | null {
  const normalized = text.toLowerCase().trim();

  // Pattern dạng: 2tr5, 1củ5, 1m5 -> 2.5 triệu
  const splitUnitMatch = normalized.match(/(\d+)(?:tr|triệu|trieu|củ|cu|m)(\d+)(?:k|nghìn|ngàn)?(?=\s|$|[.,!?;])/);
  if (splitUnitMatch) {
    const main = parseInt(splitUnitMatch[1], 10);
    const sub = parseInt(splitUnitMatch[2], 10);
    // Ví dụ 2tr5 = 2.500.000 (sub 5 nghĩa là 500k nếu sub < 10)
    const subAmount = sub < 10 ? sub * 100_000 : sub * 10_000;
    return {
      amount: main * 1_000_000 + subAmount,
      matchedStr: splitUnitMatch[0],
    };
  }

  // Pattern dạng: 2.5tr, 2,5 triệu, 3 tr, 3 củ
  const millionMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|trieu|củ|cu|m)(?=\s|$|[.,!?;])/);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(',', '.'));
    if (!isNaN(num)) {
      return {
        amount: Math.round(num * 1_000_000),
        matchedStr: millionMatch[0],
      };
    }
  }

  // Pattern dạng: 2 lít = 200k
  const litMatch = normalized.match(/(\d+)\s*(?:lít|lit)(?=\s|$|[.,!?;])/);
  if (litMatch) {
    const num = parseInt(litMatch[1], 10);
    return {
      amount: num * 100_000,
      matchedStr: litMatch[0],
    };
  }

  // Pattern dạng: 45k, 50 k, 150 nghìn, 200 ngàn
  const thousandMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|nghin|ngàn|ngan)(?=\s|$|[.,!?;])/);
  if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(',', '.'));
    if (!isNaN(num)) {
      return {
        amount: Math.round(num * 1_000),
        matchedStr: thousandMatch[0],
      };
    }
  }

  // Pattern số nguyên trực tiếp: 50.000, 500,000, 50000 (từ 1.000 trở lên)
  const rawNumberMatch = normalized.match(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{4,9}\b/);
  if (rawNumberMatch) {
    const cleanNum = rawNumberMatch[0].replace(/[.,]/g, '');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0) {
      return {
        amount: num,
        matchedStr: rawNumberMatch[0],
      };
    }
  }

  return null;
}

/**
 * Phân tích câu nói / câu gõ tự nhiên tiếng Việt thành giao dịch có cấu trúc
 */
export function parseNaturalLanguageInput(rawText: string): ParsedSmartInput {
  const result: ParsedSmartInput = {
    rawText,
    type: 'expense',
  };

  const lower = rawText.toLowerCase().trim();

  // 1. Kiểm tra nếu là giao dịch CHUYỂN TIỀN (Transfer)
  const isTransfer =
    lower.includes('chuyển') ||
    lower.includes('chuyen sang') ||
    lower.includes('rút tiền') ||
    lower.includes('nạp vào') ||
    lower.includes('chuyển khoản sang');

  if (isTransfer) {
    result.type = 'transfer';
    result.category = 'Chuyển tiền';
    result.categoryIcon = '🔄';
  }

  // 2. Trích xuất số tiền
  const extracted = extractAmount(lower);
  if (extracted) {
    result.amount = extracted.amount;
  }

  // 3. Nếu chưa phải transfer, kiểm tra xem là THU NHẬP hay CHI TIÊU
  if (!isTransfer) {
    const isExplicitIncome =
      lower.startsWith('nhận') ||
      lower.startsWith('thu') ||
      lower.includes('lương') ||
      lower.includes('được tặng') ||
      lower.includes('được lì xì') ||
      lower.includes('đòi được nợ');

    let matchedCategory = CATEGORY_KEYWORDS.find((cat) =>
      cat.keywords.some((kw) => {
        // Kiểm tra từ khóa nguyên vẹn hoặc ranh giới từ để tránh match nhầm 'đổ' trong 'đổ xăng' với từ khác
        const regex = new RegExp(`(^|\\s|[.,!?;])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s|[.,!?;])`, 'i');
        return regex.test(lower);
      })
    );

    if (matchedCategory) {
      result.category = matchedCategory.name;
      result.categoryIcon = matchedCategory.icon;
      result.type = matchedCategory.type;
    } else {
      if (isExplicitIncome) {
        result.type = 'income';
        result.category = 'Thu khác';
        result.categoryIcon = '💰';
      } else {
        result.type = 'expense';
        result.category = 'Ăn uống'; // default phổ biến nhất
        result.categoryIcon = '🍜';
      }
    }
  }

  // 4. Tìm kiếm ví trong câu
  for (const w of WALLET_KEYWORDS) {
    if (w.keywords.some((kw) => lower.includes(kw))) {
      result.walletName = w.nameFragment;
      break;
    }
  }

  // 5. Làm sạch ghi chú (loại bỏ số tiền và đơn vị để lấy nội dung mô tả)
  let cleanedNote = rawText;
  if (extracted) {
    cleanedNote = cleanedNote.replace(new RegExp(extracted.matchedStr, 'i'), '');
  }
  cleanedNote = cleanedNote
    .replace(/\b(hôm nay|hôm qua|chuyển sang|nạp vào|vào ví|bằng)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  result.note = cleanedNote || rawText;

  return result;
}
