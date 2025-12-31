'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { DeparturePoint, Destination, MeetingPlan, Coordinate } from '@/types';
import { generateMeetingPlans, generateMeetingPlansWithAPI } from '@/lib/algorithm';
import { getMockAddress, reverseGeocode } from '@/lib/map';
import LocationInput from '@/components/LocationInput';
import PlanCard from '@/components/PlanCard';
import {
  Compass,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Github,
  MapPin,
  Users,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';

// 动态导入地图组件（避免 SSR 问题）
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500">地图加载中...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  // 状态管理
  const [departures, setDepartures] = useState<DeparturePoint[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [plans, setPlans] = useState<MeetingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MeetingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 添加出发点
  const handleAddDeparture = useCallback((departure: DeparturePoint) => {
    setDepartures((prev) => [...prev, departure]);
    setShowResults(false);
    setPlans([]);
    setSelectedPlan(null);
  }, []);

  // 删除出发点
  const handleRemoveDeparture = useCallback((id: string) => {
    setDepartures((prev) => prev.filter((d) => d.id !== id));
    setShowResults(false);
    setPlans([]);
    setSelectedPlan(null);
  }, []);

  // 更新出发点
  const handleUpdateDeparture = useCallback((id: string, updates: Partial<DeparturePoint>) => {
    setDepartures((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    // 如果已经有方案，更新方案
    if (plans.length > 0) {
      setShowResults(false);
    }
  }, [plans.length]);

  // 添加目的地
  const handleAddDestination = useCallback((destination: Destination) => {
    setDestinations((prev) => [...prev, destination]);
    setShowResults(false);
    setPlans([]);
    setSelectedPlan(null);
  }, []);

  // 删除目的地
  const handleRemoveDestination = useCallback((id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    setShowResults(false);
    setPlans([]);
    setSelectedPlan(null);
  }, []);

  // 计算推荐方案
  const handleCalculate = useCallback(async () => {
    if (departures.length < 2) return;

    setIsCalculating(true);

    try {
      // 使用真实 API 生成推荐方案
      // 可以通过传入 useRealAPI: false 来使用估算版本
      const newPlans = await generateMeetingPlansWithAPI(
        departures,
        destinations,
        '北京',  // 城市，用于公交查询
        true     // 使用真实 API
      );

      // 为每个方案获取真实地址
      const plansWithAddress = await Promise.all(
        newPlans.map(async (plan) => {
          // 尝试获取真实地址，失败则使用模拟地址
          const realAddress = await reverseGeocode(plan.coordinate);
          return {
            ...plan,
            address: realAddress || getMockAddress(plan.coordinate),
          };
        })
      );

      setPlans(plansWithAddress);
      setSelectedPlan(plansWithAddress[0] || null);
      setShowResults(true);
    } catch (error) {
      console.error('计算方案出错:', error);
      // 出错时退回到估算版本
      const fallbackPlans = generateMeetingPlans(departures, destinations);
      const plansWithAddress = fallbackPlans.map((plan) => ({
        ...plan,
        address: getMockAddress(plan.coordinate),
      }));
      setPlans(plansWithAddress);
      setSelectedPlan(plansWithAddress[0] || null);
      setShowResults(true);
    } finally {
      setIsCalculating(false);
    }
  }, [departures, destinations]);

  // 选择方案
  const handleSelectPlan = useCallback((plan: MeetingPlan) => {
    setSelectedPlan(plan);
  }, []);

  // 地图点击
  const handleMapClick = useCallback((coordinate: Coordinate) => {
    console.log('Map clicked:', coordinate);
    // 可以在这里实现点击地图添加出发点的功能
  }, []);

  // 是否可以计算
  const canCalculate = useMemo(() => departures.length >= 2, [departures.length]);

  return (
    <div className="page-container">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-slate-800">Rally Point</h1>
                <p className="text-xs text-slate-500 -mt-0.5">智能汇合点推荐</p>
              </div>
            </div>

            {/* 右侧链接 */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero 区域 */}
          {departures.length === 0 && destinations.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                让聚会不再为地点发愁
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
                找到最佳汇合点
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto mb-8">
                输入多个出发点、目的地和出行方式，AI 将为你推荐最优汇合方案，
                <br className="hidden sm:block" />
                兼顾效率与公平，让每个人都满意。
              </p>

              {/* 特性列表 */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <span>出发点 + 目的地</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-5 h-5 text-primary-500" />
                  <span>个性化出行方式</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Zap className="w-5 h-5 text-primary-500" />
                  <span>智能推荐理由</span>
                </div>
              </div>

              <ChevronDown className="w-6 h-6 text-slate-400 mx-auto animate-bounce" />
            </div>
          )}

          {/* 主体内容 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧：输入区域 */}
            <div className="lg:col-span-4 space-y-6">
              {/* 出发点和目的地输入 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-5">
                <LocationInput
                  departures={departures}
                  destinations={destinations}
                  onAddDeparture={handleAddDeparture}
                  onRemoveDeparture={handleRemoveDeparture}
                  onUpdateDeparture={handleUpdateDeparture}
                  onAddDestination={handleAddDestination}
                  onRemoveDestination={handleRemoveDestination}
                />
              </div>

              {/* 计算按钮 */}
              {departures.length >= 2 && (
                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate || isCalculating}
                  className={clsx(
                    'w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300',
                    'flex items-center justify-center gap-3',
                    'btn-ripple',
                    canCalculate && !isCalculating
                      ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:-translate-y-0.5'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      正在计算最佳方案...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {showResults ? '重新计算' : '开始推荐汇合点'}
                    </>
                  )}
                </button>
              )}

              {/* 提示信息 */}
              {departures.length === 1 && (
                <div className="text-center text-sm text-slate-500 py-4">
                  还需要添加至少 1 个出发点才能开始推荐
                </div>
              )}
            </div>

            {/* 右侧：地图和结果 */}
            <div className="lg:col-span-8 space-y-6">
              {/* 地图 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div className="map-container">
                  <MapView
                    departures={departures}
                    destinations={destinations}
                    selectedPlan={selectedPlan}
                    plans={plans}
                    onMapClick={handleMapClick}
                  />
                </div>
              </div>

              {/* 推荐方案 */}
              {showResults && plans.length > 0 && (
                <div className="space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500" />
                      推荐方案
                    </h2>
                    <span className="text-sm text-slate-500">
                      共 {plans.length} 个方案供选择
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {plans.map((plan, index) => (
                      <div
                        key={plan.id}
                        className="animate-slide-up-delayed"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <PlanCard
                          plan={plan}
                          rank={index}
                          isSelected={selectedPlan?.id === plan.id}
                          onSelect={() => handleSelectPlan(plan)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="border-t border-slate-200/50 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary-500" />
              <span>Rally Point - 让聚会更简单</span>
            </div>
            <div>
              MVP 版本 · 仅供演示 · 基于估算的路径规划
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

