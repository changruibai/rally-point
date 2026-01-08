import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rally Point - 最佳集合点',
  description: '帮助多人找到最公平、最便捷的集合地点',
  keywords: ['集合点', '聚会', '路线规划', '地图'],
  authors: [{ name: 'Rally Point' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#FF6B35',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
