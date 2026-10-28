# Sổ Chi Tiêu Thông Minh (Expense Tracker)

Ứng dụng web ghi chép chi tiêu cá nhân tốc độ cao, hỗ trợ đa thiết bị (Laptop & Điện thoại), bảo mật tuyệt đối với kiến trúc **Zero-Trust Row Level Security (PostgreSQL)**.

---

## ✨ Tính Năng Nổi Bật

- **⚡ Nhập liệu thần tốc trong 3 giây:** Modal trực quan, bàn phím số to rõ, cộng nhanh mệnh giá (`+10k`, `+50k`, `+100k`, `+500k`), chọn danh mục 1-chạm.
- **🛡️ Bảo mật đa tầng (Row Level Security):** Dùng chung 1 website nhưng dữ liệu của ai chỉ người đó thấy 100%. Không ai có thể xem trộm của ai.
- **🔄 Đồng bộ Realtime:** Ghi chép trên điện thoại, số liệu tự động cập nhật ngay trên laptop mà không cần tải lại trang.
- **🎨 2 Chế độ hiển thị (Theme):** Chuyển đổi linh hoạt giữa **Dark Mode** (Copilot Money) và **Light Mode** (Stripe).
- **📊 Trực quan hóa tài chính:** 3 Thẻ chỉ số (Số dư, Thu, Chi) và Biểu đồ vành khuyên Donut SVG siêu nhẹ.
- **🕒 Lịch sử giao dịch & Tìm kiếm:** Phân nhóm theo ngày, tìm kiếm tức thì theo danh mục hoặc ghi chú.
- **📥 Xuất Excel chuẩn:** Bấm 1 nút tải ngay file báo cáo `.xlsx` chi tiết.
- **📱 Hỗ trợ PWA:** Cài đặt trực tiếp lên màn hình chính điện thoại như ứng dụng native.

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Backend & Database:** Supabase (Auth + PostgreSQL + Realtime + RLS)
- **Icons & Animation:** Lucide React, Motion
- **Tiện ích:** XLSX (xuất báo cáo Excel), Tailwind Merge, CLSX
- **Package Manager:** `pnpm`

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ

1. **Clone repository:**
   ```bash
   git clone https://github.com/Grizz0o0/expense-tracker.git
   cd expense-tracker
   ```

2. **Cài đặt thư viện:**
   ```bash
   pnpm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo file `.env.local` tại thư mục gốc với nội dung:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

4. **Khởi chạy ứng dụng:**
   ```bash
   pnpm dev
   ```
   Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 🌐 Triển Khai Lên Vercel (Production)

1. Import repository `expense-tracker` trên [Vercel](https://vercel.com).
2. Thêm 2 biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong phần **Environment Variables**.
3. Bấm **Deploy**.
