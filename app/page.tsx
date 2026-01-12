'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import ParticipantList from '@/components/ParticipantList';
import DestinationInput from '@/components/DestinationInput';
import POITypeSelector from '@/components/POITypeSelector';
import FoodPreferenceSelector from '@/components/FoodPreferenceSelector';
import StrategySelector from '@/components/StrategySelector';
import CalculateButton from '@/components/CalculateButton';
import ResultPanel from '@/components/ResultPanel';
import { useAppStore } from '@/store/useAppStore';

// 动态导入地图组件，禁用 SSR
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-500">加载地图中...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { bestPlan, isCalculating } = useAppStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 头部 */}
      <Header />

      {/* 主内容区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* 左侧面板 - 可独立滚动 */}
          <div className="w-full lg:w-[380px] flex-shrink-0 overflow-y-auto custom-scrollbar">
            <div className="space-y-4 pb-4">
              {/* 参与者列表 */}
              <ParticipantList />

              {/* 集合场景（含目的地输入） */}
              <DestinationInput />

              {/* 集合点类型选择 */}
              <POITypeSelector />

              {/* 饮食偏好选择 */}
              <FoodPreferenceSelector />

              {/* 优化策略选择 */}
              <StrategySelector />

              {/* 计算按钮 */}
              <CalculateButton />

              {/* 结果面板 */}
              {bestPlan && <ResultPanel />}
            </div>
          </div>

          {/* 右侧地图 */}
          <div className="flex-1 min-h-[500px] lg:min-h-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full overflow-hidden">
              <MapView />
            </div>
          </div>
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="py-4 text-center text-sm text-gray-400">
        <p>Rally Point © 2024 - Let&apos;s Rally! 🎯</p>
      </footer>

      {/* 全局加载遮罩 */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">正在寻找最佳集合点</h3>
            <p className="text-sm text-gray-500">请稍候，正在计算路线...</p>
          </div>
        </div>
      )}
    </div>
  );
}

