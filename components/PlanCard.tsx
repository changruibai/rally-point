'use client';

import React, { useState } from 'react';
import type { MeetingPlan, TravelMode, TransitSegment, TransitPlan, TransitType } from '@/types';
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
  ChevronDown,
  Trophy,
  Medal,
  Award,
  Flag,
  ArrowRight,
  Bus,
  CircleDot,
  Navigation,
  ExternalLink,
  Map
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDuration, formatDistance } from '@/lib/algorithm';
import { generateAmapNavUrl, generateBaiduNavUrl, generateQQMapNavUrl } from '@/lib/map';

interface PlanCardProps {
  plan: MeetingPlan;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

// 单独的导航按钮组件
const NavButton: React.FC<{
  coordinate: { lng: number; lat: number };
  name: string;
  originCoordinate?: { lng: number; lat: number };
  originName?: string;
  size?: 'sm' | 'md';
}> = ({ coordinate, name, originCoordinate, originName, size = 'sm' }) => {
  const [showMenu, setShowMenu] = useState(false);

  const openNav = (e: React.MouseEvent, type: 'amap' | 'baidu' | 'qqmap') => {
    e.stopPropagation();
    let url = '';

    switch (type) {
      case 'amap':
        url = generateAmapNavUrl(coordinate, name, originCoordinate, originName);
        break;
      case 'baidu':
        url = generateBaiduNavUrl(coordinate, name);
        break;
      case 'qqmap':
        url = generateQQMapNavUrl(coordinate, name);
        break;
    }

    window.open(url, '_blank');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className={clsx(
          "flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors",
          size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1'
        )}
      >
        <Navigation className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>导航</span>
      </button>

      {showMenu && (
        <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[120px] z-30">
          <button
            onClick={(e) => openNav(e, 'amap')}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-1.5"
          >
            <Map className="w-3 h-3" />
            高德地图
          </button>
          <button
            onClick={(e) => openNav(e, 'baidu')}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-1.5"
          >
            <Map className="w-3 h-3" />
            百度地图
          </button>
          <button
            onClick={(e) => openNav(e, 'qqmap')}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-1.5"
          >
            <Map className="w-3 h-3" />
            腾讯地图
          </button>
        </div>
      )}
    </div>
  );
};

// 出行方式图标
const TRAVEL_MODE_ICONS: Record<TravelMode, React.ElementType> = {
  driving: Car,
  transit: Train,
  walking: Footprints,
};

// 公交类型图标
const TRANSIT_TYPE_ICONS: Record<TransitType, React.ElementType> = {
  subway: Train,
  bus: Bus,
  walk: Footprints,
  railway: Train,
  taxi: Car,
};

// 公交类型标签
const TRANSIT_TYPE_LABELS: Record<TransitType, string> = {
  subway: '地铁',
  bus: '公交',
  walk: '步行',
  railway: '火车',
  taxi: '打车',
};

// 排名徽章
const RANK_BADGES = [
  { icon: Trophy, color: 'from-yellow-400 to-amber-500', label: '最佳' },
  { icon: Medal, color: 'from-slate-300 to-slate-400', label: '备选A' },
  { icon: Award, color: 'from-orange-300 to-orange-400', label: '备选B' },
];

// 公交段落组件
const TransitSegmentItem: React.FC<{ segment: TransitSegment }> = ({ segment }) => {
  const Icon = TRANSIT_TYPE_ICONS[segment.type] || CircleDot;

  // 步行段简化显示
  if (segment.type === 'walk') {
    if (segment.distance < 100) return null; // 太短的步行不显示
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Footprints className="w-3 h-3" />
        <span>步行{Math.round(segment.distance)}米</span>
      </div>
    );
  }

  // 地铁/公交段
  const bgColor = segment.type === 'subway'
    ? 'bg-blue-50'
    : segment.type === 'bus'
      ? 'bg-green-50'
      : 'bg-slate-50';

  return (
    <div className={clsx('flex items-center gap-2 px-2 py-1.5 rounded-lg', bgColor)}>
      <div
        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: segment.color || '#0078D7' }}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-700 truncate">
          {segment.lineName}
        </div>
        {segment.startStation && segment.endStation && (
          <div className="text-[10px] text-slate-500 truncate">
            {segment.startStation} → {segment.endStation}
            {segment.stationCount && ` (${segment.stationCount}站)`}
          </div>
        )}
      </div>
      <div className="text-xs text-slate-500 shrink-0">
        {segment.duration}分钟
      </div>
    </div>
  );
};

// 公交方案详情组件
const TransitPlanDetail: React.FC<{ plan: TransitPlan }> = ({ plan }) => {
  // 过滤掉太短的步行段
  const significantSegments = plan.segments.filter(
    s => s.type !== 'walk' || s.distance >= 100
  );

  if (significantSegments.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {significantSegments.map((segment, idx) => (
        <TransitSegmentItem key={idx} segment={segment} />
      ))}
      {plan.walkingDistance > 500 && (
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Footprints className="w-3 h-3" />
          总步行约{Math.round(plan.walkingDistance)}米
        </div>
      )}
    </div>
  );
};

// 公交方案摘要（单行显示）
const TransitPlanSummary: React.FC<{ plan: TransitPlan }> = ({ plan }) => {
  const transitSegments = plan.segments.filter(s => s.type !== 'walk');

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {transitSegments.map((segment, idx) => {
        const Icon = TRANSIT_TYPE_ICONS[segment.type] || CircleDot;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white"
              style={{ backgroundColor: segment.color || '#0078D7' }}
            >
              <Icon className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{segment.lineName}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const PlanCard: React.FC<PlanCardProps> = ({ plan, rank, isSelected, onSelect }) => {
  const badge = RANK_BADGES[rank] || RANK_BADGES[2];
  const BadgeIcon = badge.icon;
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [showNavMenu, setShowNavMenu] = useState(false);

  // 切换路线详情展开状态
  const toggleRouteExpand = (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    setExpandedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  // 复制地址
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${plan.name}\n地址：${plan.address || '待确认'}\n坐标：${plan.coordinate.lng.toFixed(6)}, ${plan.coordinate.lat.toFixed(6)}`;
    navigator.clipboard.writeText(text);
  };

  // 导航按钮点击
  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNavMenu(!showNavMenu);
  };

  // 打开导航
  const openNavigation = (e: React.MouseEvent, type: 'amap' | 'baidu' | 'qqmap') => {
    e.stopPropagation();
    const destName = plan.name || plan.address || '汇合点';
    let url = '';

    switch (type) {
      case 'amap':
        url = generateAmapNavUrl(plan.coordinate, destName);
        break;
      case 'baidu':
        url = generateBaiduNavUrl(plan.coordinate, destName);
        break;
      case 'qqmap':
        url = generateQQMapNavUrl(plan.coordinate, destName);
        break;
    }

    window.open(url, '_blank');
    setShowNavMenu(false);
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
          const hasTransitPlan = route.transitPlan && route.transitPlan.segments.length > 0;
          const isExpanded = expandedRoutes.has(route.departureId);

          return (
            <div
              key={route.departureId}
              className="bg-slate-50 rounded-lg overflow-hidden"
            >
              {/* 路线摘要 */}
              <div
                className={clsx(
                  "flex items-center justify-between py-2 px-3",
                  hasTransitPlan && "cursor-pointer hover:bg-slate-100 transition-colors"
                )}
                onClick={hasTransitPlan ? (e) => toggleRouteExpand(e, route.departureId) : undefined}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-slate-700 shrink-0">{route.departureName}</span>
                  <ModeIcon className="w-4 h-4 text-slate-400 shrink-0" />

                  {/* 公交方案摘要 */}
                  {hasTransitPlan && !isExpanded && (
                    <div className="min-w-0 flex-1">
                      <TransitPlanSummary plan={route.transitPlan!} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm shrink-0">
                  <span className="text-slate-500">{formatDistance(route.distance)}</span>
                  <span className="font-semibold text-slate-800">{formatDuration(route.duration)}</span>

                  {/* 导航按钮 */}
                  <NavButton
                    coordinate={plan.coordinate}
                    name={plan.name || '汇合点'}
                    size="sm"
                  />

                  {hasTransitPlan && (
                    <ChevronDown
                      className={clsx(
                        "w-4 h-4 text-slate-400 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </div>
              </div>

              {/* 展开的详细路线 */}
              {hasTransitPlan && isExpanded && (
                <div className="px-3 pb-3 border-t border-slate-200">
                  <TransitPlanDetail plan={route.transitPlan!} />
                </div>
              )}

              {/* 驾车信息 */}
              {route.drivingRoute && (
                <div className="px-3 pb-2 text-xs text-slate-500 flex items-center gap-3">
                  {route.drivingRoute.tolls !== undefined && route.drivingRoute.tolls > 0 && (
                    <span>过路费约¥{route.drivingRoute.tolls}</span>
                  )}
                  {route.drivingRoute.trafficLights !== undefined && (
                    <span>{route.drivingRoute.trafficLights}个红绿灯</span>
                  )}
                </div>
              )}
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
          {plan.destinationRoutes.map((route) => {
            const hasTransitPlan = route.transitPlan && route.transitPlan.segments.length > 0;
            const destRouteId = `dest-${route.destinationId}`;
            const isExpanded = expandedRoutes.has(destRouteId);

            return (
              <div
                key={route.destinationId}
                className="bg-emerald-50 rounded-lg overflow-hidden"
              >
                <div
                  className={clsx(
                    "flex items-center justify-between py-2 px-3",
                    hasTransitPlan && "cursor-pointer hover:bg-emerald-100 transition-colors"
                  )}
                  onClick={hasTransitPlan ? (e) => toggleRouteExpand(e, destRouteId) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium text-emerald-700 shrink-0">{route.destinationName}</span>

                    {/* 公交方案摘要 */}
                    {hasTransitPlan && !isExpanded && (
                      <div className="min-w-0 flex-1">
                        <TransitPlanSummary plan={route.transitPlan!} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm shrink-0">
                    <span className="text-emerald-600">{formatDistance(route.distance)}</span>
                    <span className="font-semibold text-emerald-700">{formatDuration(route.duration)}</span>
                    {hasTransitPlan && (
                      <ChevronDown
                        className={clsx(
                          "w-4 h-4 text-emerald-400 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* 展开的详细路线 */}
                {hasTransitPlan && isExpanded && (
                  <div className="px-3 pb-3 border-t border-emerald-200">
                    <TransitPlanDetail plan={route.transitPlan!} />
                  </div>
                )}
              </div>
            );
          })}
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-500 transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>

          {/* 导航按钮 */}
          <div className="relative">
            <button
              onClick={handleNavClick}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-500 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              导航
            </button>

            {/* 导航菜单 */}
            {showNavMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px] z-20">
                <button
                  onClick={(e) => openNavigation(e, 'amap')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-colors"
                >
                  <Map className="w-4 h-4" />
                  高德地图
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </button>
                <button
                  onClick={(e) => openNavigation(e, 'baidu')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-colors"
                >
                  <Map className="w-4 h-4" />
                  百度地图
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </button>
                <button
                  onClick={(e) => openNavigation(e, 'qqmap')}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-600 flex items-center gap-2 transition-colors"
                >
                  <Map className="w-4 h-4" />
                  腾讯地图
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>

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

