'use client';

import React, { memo } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** 头部导航组件 */
const Header: React.FC = memo(function Header() {
  const { reset, bestPlan } = useAppStore();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo 和标题 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md relative overflow-hidden">
            {/* 中心白点 */}
            <div className="w-3 h-3 bg-white rounded-full z-10" />
            {/* 四个参与者小点 */}
            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-400 rounded-full" />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-green-400 rounded-full" />
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-purple-400 rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Rally<span className="text-primary">Point</span>
            </h1>
            <p className="text-xs text-gray-500">最佳集合点</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          {bestPlan && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 
                       hover:bg-gray-100 rounded-lg transition-colors"
            >
              重新开始
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;



