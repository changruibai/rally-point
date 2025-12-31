'use client';

import React from 'react';
import type { MeetingPlan, TravelMode } from '@/types';
import { 
  Target, 
  Clock, 
  MapPin, 
  Car, 
  Train, 
  Footprints,
  Check,
  AlertCircle,
  Copy,
  ChevronRight,
  Trophy,
  Medal,
  Award,
  Flag,
  ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDuration, formatDistance } from '@/lib/algorithm';

interface PlanCardProps {
  plan: MeetingPlan;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

// 出行方式图标
const TRAVEL_MODE_ICONS: Record<TravelMode, React.ElementType> = {
  driving: Car,
  transit: Train,
  walking: Footprints,
};

// 排名徽章
const RANK_BADGES = [
  { icon: Trophy, color: 'from-yellow-400 to-amber-500', label: '最佳' },
  { icon: Medal, color: 'from-slate-300 to-slate-400', label: '备选A' },
  { icon: Award, color: 'from-orange-300 to-orange-400', label: '备选B' },
];

const PlanCard: React.FC<PlanCardProps> = ({ plan, rank, isSelected, onSelect }) => {
  const badge = RANK_BADGES[rank] || RANK_BADGES[2];
  const BadgeIcon = badge.icon;

  // 复制地址
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${plan.name}\n地址：${plan.address || '待确认'}\n坐标：${plan.coordinate.lng.toFixed(6)}, ${plan.coordinate.lat.toFixed(6)}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-1',
        isSelected
          ? 'border-primary-400 bg-primary-50/50 shadow-lg shadow-primary-100'
          : 'border-slate-200 bg-white hover:border-primary-200'
      )}
    >
      {/* 排名徽章 */}
      <div className={clsx(
        'absolute -top-3 -left-3 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg',
        `bg-gradient-to-br ${badge.color}`
      )}>
        <BadgeIcon className="w-6 h-6 text-white" />
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      {/* 头部信息 */}
      <div className="ml-8 mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          {plan.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{plan.address || `${plan.coordinate.lng.toFixed(4)}, ${plan.coordinate.lat.toFixed(4)}`}</span>
        </p>
      </div>

      {/* 推荐理由 */}
      <div className="bg-gradient-to-r from-primary-50 to-emerald-50 rounded-xl p-3 mb-4">
        <p className="text-sm text-primary-700 font-medium">
          💡 {plan.recommendation}
        </p>
      </div>

      {/* 时间统计 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">平均耗时</div>
          <div className="text-lg font-bold text-slate-800">{formatDuration(plan.avgDuration)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">最短</div>
          <div className="text-lg font-bold text-green-600">{formatDuration(plan.minDuration)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">最长</div>
          <div className="text-lg font-bold text-amber-600">{formatDuration(plan.maxDuration)}</div>
        </div>
      </div>

      {/* 各出发点详情 */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
          <Clock className="w-4 h-4" />
          各方预计耗时
        </div>
        {plan.routes.map((route) => {
          const ModeIcon = TRAVEL_MODE_ICONS[route.travelMode];
          return (
            <div
              key={route.departureId}
              className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">{route.departureName}</span>
                <ModeIcon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">{formatDistance(route.distance)}</span>
                <span className="font-semibold text-slate-800">{formatDuration(route.duration)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 到目的地详情 */}
      {plan.destinationRoutes && plan.destinationRoutes.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-sm font-medium text-emerald-700 flex items-center gap-1">
            <Flag className="w-4 h-4" />
            到目的地
          </div>
          {plan.destinationRoutes.map((route) => (
            <div
              key={route.destinationId}
              className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-emerald-700">{route.destinationName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600">{formatDistance(route.distance)}</span>
                <span className="font-semibold text-emerald-700">{formatDuration(route.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 优缺点 */}
      <div className="space-y-2">
        {plan.pros.length > 0 && (
          <div className="space-y-1">
            {plan.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">{pro}</span>
              </div>
            ))}
          </div>
        )}
        {plan.cons.length > 0 && (
          <div className="space-y-1">
            {plan.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-slate-600">{con}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={handleCopyAddress}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-500 transition-colors"
        >
          <Copy className="w-4 h-4" />
          复制地址
        </button>
        <div className={clsx(
          'flex items-center gap-1 text-sm font-medium transition-colors',
          isSelected ? 'text-primary-500' : 'text-slate-400'
        )}>
          {isSelected ? '已选择' : '点击选择'}
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 综合评分 */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <div className={clsx(
          'px-2 py-1 rounded-full text-xs font-bold',
          plan.score >= 70 ? 'bg-green-100 text-green-700' :
          plan.score >= 50 ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-600'
        )}>
          {plan.score}分
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlanCard);

