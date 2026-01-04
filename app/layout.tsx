import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rally Point - 智能汇合点推荐',
  description: '帮助多位朋友找到最佳汇合地点，让出行更高效、更公平',
  keywords: ['汇合点', '聚会', '地点推荐', '出行规划'],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-gradient-mesh min-h-screen">
        {children}
      </body>
    </html>
  );
}


