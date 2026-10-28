'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TransactionType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  Wallet,
} from '@/types/database';
import { toDateString } from '@/lib/utils';
import { parseNaturalLanguageInput } from '@/lib/smartInputParser';
import { X, Check, Loader2, Sparkles, Mic, MicOff, Wallet as WalletIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

const MAX_AMOUNT = 9_999_999_999_999;

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets?: Wallet[];
}

// Typing cho Web Speech API
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

export function QuickAddModal({ isOpen, onClose, onSuccess, wallets = [] }: QuickAddModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0].name);
  const [categoryIcon, setCategoryIcon] = useState(DEFAULT_EXPENSE_CATEGORIES[0].icon);
  const [walletId, setWalletId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toDateString(new Date()));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // AI Smart Natural Input & Voice
  const [smartPrompt, setSmartPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Khởi tạo ví mặc định
  useEffect(() => {
    if (wallets && wallets.length > 0 && !walletId) {
      const def = wallets.find((w) => w.is_default) || wallets[0];
      setWalletId(def.id);
    }
  }, [wallets, walletId]);

  // Khởi tạo SpeechRecognition nếu trình duyệt hỗ trợ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      };
      const SpeechRecognitionConstructor =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            handleApplySmartInput(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
          showToast('Không thể thu âm giọng nói, vui lòng thử gõ văn bản', 'error');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [showToast]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Xử lý NLP Tiếng Việt khi người dùng nhập câu hoặc nói
  const handleApplySmartInput = (text: string) => {
    if (!text.trim()) return;
    setSmartPrompt(text);

    const parsed = parseNaturalLanguageInput(text);
    if (parsed.amount) {
      setAmountStr(String(parsed.amount));
    }
    if (parsed.type && parsed.type !== 'transfer') {
      setType(parsed.type);
    }
    if (parsed.category) {
      setCategory(parsed.category);
    }
    if (parsed.categoryIcon) {
      setCategoryIcon(parsed.categoryIcon);
    }
    if (parsed.note) {
      setNote(parsed.note);
    }

    // Tự động match tên ví nếu có
    if (parsed.walletName && wallets.length > 0) {
      const foundWallet = wallets.find((w) =>
        w.name.toLowerCase().includes(parsed.walletName!.toLowerCase())
      );
      if (foundWallet) {
        setWalletId(foundWallet.id);
      }
    }

    showToast('✨ AI đã tự động phân tích và điền biểu mẫu!', 'success');
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      showToast('Trình duyệt chưa hỗ trợ ghi âm trực tiếp, hãy gõ câu mô tả nhé', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('🎙️ Đang lắng nghe... Hãy nói ví dụ: "Ăn phở 45k tiền mặt"', 'info');
      } catch {
        setIsListening(false);
      }
    }
  };

  const currentCategories =
    type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const firstCat =
      nextType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES[0] : DEFAULT_INCOME_CATEGORIES[0];
    setCategory(firstCat.name);
    setCategoryIcon(firstCat.icon);
  };

  const handleSelectCategory = (name: string, icon: string) => {
    setCategory(name);
    setCategoryIcon(icon);
  };

  const handleAddPreset = (value: number) => {
    const current = Number(amountStr.replace(/\D/g, '')) || 0;
    const next = Math.min(current + value, MAX_AMOUNT);
    setAmountStr(String(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amountStr.replace(/\D/g, ''));

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (numericAmount > MAX_AMOUNT) {
      setErrorMsg('Số tiền không được vượt quá 9.999 tỷ VNĐ');
      return;
    }

    if (!date || date.length < 10 || isNaN(Date.parse(date))) {
      setErrorMsg('Vui lòng chọn ngày giao dịch hợp lệ');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      // 1. Ghi giao dịch
      const { error: transError } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          amount: numericAmount,
          type,
          category,
          category_icon: categoryIcon,
          note: note.trim() || null,
          transaction_date: date,
          wallet_id: walletId || null,
        },
      ]);

      if (transError) throw transError;

      // 2. Cập nhật số dư Ví tương ứng
      if (walletId) {
        const targetWallet = wallets.find((w) => w.id === walletId);
        if (targetWallet) {
          const balanceDiff = type === 'income' ? numericAmount : -numericAmount;
          await supabase
            .from('wallets')
            .update({
              balance: Number(targetWallet.balance || 0) + balanceDiff,
            })
            .eq('id', walletId)
            .eq('user_id', user.id);
        }
      }

      // Reset
      setAmountStr('');
      setNote('');
      setSmartPrompt('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      const msg =
        error.message === 'Failed to fetch'
          ? 'Lỗi kết nối mạng, vui lòng kiểm tra đường truyền internet.'
          : error.message || 'Không thể lưu giao dịch';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayAmountFormatted = amountStr
    ? new Intl.NumberFormat('vi-VN').format(Number(amountStr.replace(/\D/g, '')))
    : '0';

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Thêm chi tiêu nhanh"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Chi tiêu (-)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Thu nhập (+)
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart NLP / Voice Assistant Bar */}
            <div className="mt-3.5 p-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={smartPrompt}
                  onChange={(e) => setSmartPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplySmartInput(smartPrompt);
                    }
                  }}
                  placeholder='AI Nhập liệu: "Ăn bún bò 45k", "Đổ xăng 70k"...'
                  className="w-full text-xs bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-xl transition cursor-pointer flex-shrink-0 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50'
                  }`}
                  title={isListening ? 'Đang lắng nghe...' : 'Nói để nhập liệu'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Form chính */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Ô số tiền lớn */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Số tiền {type === 'expense' ? 'chi' : 'thu'}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
                      type === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {type === 'expense' ? '-' : '+'}
                    {displayAmountFormatted}
                  </span>
                  <span className="text-sm font-bold text-slate-400">vnđ</span>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setAmountStr(digits ? String(Math.min(Number(digits), MAX_AMOUNT)) : '');
                  }}
                  placeholder="Nhập số tiền..."
                  className="mt-2 w-full max-w-[200px] mx-auto text-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Preset cộng nhanh */}
                <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                  {[
                    { label: '+10k', val: 10_000 },
                    { label: '+50k', val: 50_000 },
                    { label: '+100k', val: 100_000 },
                    { label: '+500k', val: 500_000 },
                    { label: '+1Tr', val: 1_000_000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleAddPreset(p.val)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountStr('')}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {/* Chọn Tài Khoản / Ví chi trả */}
              {wallets && wallets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <WalletIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{type === 'expense' ? 'Trừ từ Ví' : 'Cộng vào Ví'}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {wallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWalletId(w.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          walletId === w.id
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-base">{w.icon || '💵'}</span>
                        <div className="truncate text-xs">
                          <div className="truncate">{w.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh mục 1 chạm */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Danh mục ({category})
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                  {currentCategories.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleSelectCategory(cat.name, cat.icon)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú & Ngày */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ghi chú chi tiết
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ăn trưa bạn bè, cà phê..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Lưu Giao Dịch</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
