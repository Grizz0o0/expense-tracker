'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TelegramUserLink } from '@/types/database';
import { X, Send, Copy, Check, Loader2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

interface TelegramConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelegramConnectModal({ isOpen, onClose }: TelegramConnectModalProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [connectCode, setConnectCode] = useState<string>('');
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [telegramUsername, setTelegramUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTelegramLink = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Tìm liên kết đã có
        const { data: link, error } = await supabase
          .from('telegram_user_links')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (link) {
          setConnectCode(link.connect_code);
          setIsLinked(Boolean(link.telegram_chat_id));
          setTelegramUsername(link.telegram_username || '');
        } else {
          // Tạo mã kết nối ngẫu nhiên 6 chữ số
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const { data: newLink, error: createErr } = await supabase
            .from('telegram_user_links')
            .insert([
              {
                user_id: user.id,
                telegram_chat_id: '',
                connect_code: randomCode,
                is_active: false,
              },
            ])
            .select()
            .single();

          if (newLink) {
            setConnectCode(newLink.connect_code);
            setIsLinked(false);
          }
        }
      } catch (err: unknown) {
        console.error('Lỗi tải kết nối Telegram:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTelegramLink();
  }, [isOpen, supabase]);

  const handleCopyCode = () => {
    if (!connectCode) return;
    navigator.clipboard.writeText(`/connect ${connectCode}`);
    setCopied(true);
    showToast('Đã sao chép lệnh kết nối Telegram!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Kết nối Telegram Bot"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#10121a] shadow-2xl p-5 sm:p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg">
                  <Send className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Trợ Lý Telegram Bot 1-Giây
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ghi chép siêu tốc qua tin nhắn Telegram
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
                <span className="text-xs">Đang tạo mã kết nối...</span>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {isLinked ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Tài khoản đã được liên kết thành công!
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Telegram Username:{' '}
                      <strong className="text-slate-800 dark:text-white">
                        @{telegramUsername || 'User'}
                      </strong>
                    </p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Mở ứng dụng Telegram của bạn và nhắn bất kỳ khoản thu chi nào (ví dụ: &ldquo;Cơm 45k&rdquo;), hệ thống sẽ tự động cập nhật ngay lập tức.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-500/5 border border-sky-500/20 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                      <p className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>3 Bước Kết Nối Siêu Dễ:</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <li>Mở ứng dụng Telegram trên điện thoại hoặc máy tính.</li>
                        <li>Tìm bot Telegram của bạn hoặc bấm nút bên dưới.</li>
                        <li>Gửi mã lệnh bên dưới vào khung chat của Bot.</li>
                      </ol>
                    </div>

                    {/* Khung sao chép mã */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                      <div className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                        /connect {connectCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-bold flex items-center gap-1 hover:bg-sky-600 transition cursor-pointer shadow-sm"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center">
                      Mã kết nối riêng tư dùng để xác thực an toàn tuyệt đối với tài khoản của bạn.
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
