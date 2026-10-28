import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseNaturalLanguageInput } from '@/lib/smartInputParser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Telegram Bot update structure
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true, status: 'no_message_text' });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const telegramUsername = message.from?.username || message.from?.first_name || '';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Lệnh kết nối tài khoản: /start [CONNECT_CODE] hoặc /connect [CONNECT_CODE]
    if (text.startsWith('/start') || text.startsWith('/connect')) {
      const parts = text.split(' ');
      const code = parts[1]?.trim();

      if (!code) {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `👋 Chào mừng bạn đến với Sổ Chi Tiêu Thông Minh!\n\nĐể đồng bộ dữ liệu, vui lòng nhập lệnh:\n/connect [MÃ_KẾT_NỐI]\n(Lấy mã kết nối trong mục Cài đặt trên Web)`,
        });
      }

      // Tìm user link với mã code
      const { data: linkRecord, error: linkErr } = await supabase
        .from('telegram_user_links')
        .select('*')
        .eq('connect_code', code)
        .maybeSingle();

      if (linkErr || !linkRecord) {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: '❌ Mã kết nối không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trên Web.',
        });
      }

      // Cập nhật chat_id vào bảng telegram_user_links
      await supabase
        .from('telegram_user_links')
        .update({
          telegram_chat_id: chatId,
          telegram_username: telegramUsername,
          is_active: true,
        })
        .eq('id', linkRecord.id);

      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `🎉 Kết nối thành công với tài khoản Sổ Chi Tiêu!\n\nTừ bây giờ bạn có thể ghi chép siêu tốc bằng cách nhắn tin, ví dụ:\n• Ăn phở 45k\n• Đổ xăng 80k tiền mặt\n• Nhận lương 25tr\n• Chuyển 2tr sang tiết kiệm`,
      });
    }

    // 2. Tìm kiếm người dùng sở hữu chatId này
    const { data: userLink, error: userErr } = await supabase
      .from('telegram_user_links')
      .select('user_id')
      .eq('telegram_chat_id', chatId)
      .eq('is_active', true)
      .maybeSingle();

    if (userErr || !userLink) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `⚠️ Chưa tìm thấy liên kết tài khoản!\nVui lòng vào Web bấm nút "Kết nối Telegram" để lấy mã kết nối, sau đó gõ:\n/connect [MÃ_CỦA_BẠN]`,
      });
    }

    const userId = userLink.user_id;

    // 3. Phân tích câu nói bằng Natural Language Parser
    const parsed = parseNaturalLanguageInput(text);

    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `❓ Chưa nhận diện được số tiền trong câu: "${text}"\n\nHãy thử lại ví dụ:\n• "Cà phê 35k"\n• "Ăn trưa 50k"\n• "Đổ xăng 70k"`,
      });
    }

    // Lấy danh sách ví của user để tự match
    const { data: userWallets } = await supabase
      .from('wallets')
      .select('id, name, balance')
      .eq('user_id', userId);

    let targetWalletId: string | null = null;
    let targetWalletName = 'Mặc định';

    if (userWallets && userWallets.length > 0) {
      if (parsed.walletName) {
        const found = userWallets.find((w) =>
          w.name.toLowerCase().includes(parsed.walletName!.toLowerCase())
        );
        if (found) {
          targetWalletId = found.id;
          targetWalletName = found.name;
        }
      }
      if (!targetWalletId) {
        targetWalletId = userWallets[0].id;
        targetWalletName = userWallets[0].name;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 4. Ghi nhận giao dịch vào Supabase
    const { error: insertErr } = await supabase.from('transactions').insert([
      {
        user_id: userId,
        amount: parsed.amount,
        type: parsed.type || 'expense',
        category: parsed.category || 'Chi khác',
        category_icon: parsed.categoryIcon || '💰',
        note: `${parsed.note || text} (qua Telegram Bot)`,
        transaction_date: todayStr,
        wallet_id: targetWalletId,
      },
    ]);

    if (insertErr) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `❌ Lỗi lưu dữ liệu: ${insertErr.message}`,
      });
    }

    // 5. Cập nhật số dư ví
    if (targetWalletId) {
      const w = userWallets?.find((wal) => wal.id === targetWalletId);
      if (w) {
        const diff = parsed.type === 'income' ? parsed.amount : -parsed.amount;
        await supabase
          .from('wallets')
          .update({ balance: Number(w.balance || 0) + diff })
          .eq('id', targetWalletId)
          .eq('user_id', userId);
      }
    }

    const formattedAmount = new Intl.NumberFormat('vi-VN').format(parsed.amount);
    const typeLabel = parsed.type === 'income' ? 'Thu nhập (+)' : 'Chi tiêu (-)';

    return NextResponse.json({
      method: 'sendMessage',
      chat_id: chatId,
      text: `✅ Đã ghi nhận thành công!\n\n🏷️ Danh mục: ${parsed.categoryIcon || ''} ${parsed.category}\n💵 Số tiền: ${formattedAmount} đ (${typeLabel})\n💼 Ví: ${targetWalletName}\n📝 Ghi chú: ${parsed.note || text}\n\n👉 Web app đã cập nhật số dư thời gian thực (Realtime)!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
