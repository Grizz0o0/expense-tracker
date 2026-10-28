import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sổ Chi Tiêu Thông Minh — Bảo Mật Tuyệt Đối',
  description: 'Ghi chép chi tiêu cá nhân nhanh 3 giây, tối ưu đa thiết bị, bảo mật Row Level Security.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chi Tiêu',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08090d',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
