'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { DeparturePoint, Destination, MeetingPlan, Coordinate } from '@/types';
import { MapPin, Target, Loader2, Flag } from 'lucide-react';

interface MapViewProps {
  departures: DeparturePoint[];
  destinations: Destination[];
  selectedPlan: MeetingPlan | null;
  plans: MeetingPlan[];
  onMapClick?: (coordinate: Coordinate) => void;
}

// 颜色配置
const DEPARTURE_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

// 目的地颜色
const DESTINATION_COLOR = '#10b981'; // emerald-500

// 演示模式的静态地图组件
const DemoMap: React.FC<{
  departures: DeparturePoint[];
  destinations: Destination[];
  selectedPlan: MeetingPlan | null;
  plans: MeetingPlan[];
}> = ({ departures, destinations, selectedPlan, plans }) => {
  // 计算所有点的边界
  const allPoints = [
    ...departures.map(d => d.coordinate),
    ...destinations.map(d => d.coordinate),
    ...plans.map(p => p.coordinate),
  ];
  
  const minLng = Math.min(...allPoints.map(p => p.lng), 116.2);
  const maxLng = Math.max(...allPoints.map(p => p.lng), 116.6);
  const minLat = Math.min(...allPoints.map(p => p.lat), 39.7);
  const maxLat = Math.max(...allPoints.map(p => p.lat), 40.1);
  
  // 坐标转换为 SVG 位置
  const toSvgX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const toSvgY = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-100 via-emerald-50 to-blue-50 rounded-2xl overflow-hidden">
      {/* 网格背景 */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 地图内容 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* 出发点到汇合点的连接线 */}
        {selectedPlan && departures.map((dep, i) => (
          <line
            key={`line-dep-${i}`}
            x1={`${toSvgX(dep.coordinate.lng)}%`}
            y1={`${toSvgY(dep.coordinate.lat)}%`}
            x2={`${toSvgX(selectedPlan.coordinate.lng)}%`}
            y2={`${toSvgY(selectedPlan.coordinate.lat)}%`}
            stroke={DEPARTURE_COLORS[i % DEPARTURE_COLORS.length]}
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.6"
          />
        ))}

        {/* 汇合点到目的地的连接线 */}
        {selectedPlan && destinations.map((dest, i) => (
          <line
            key={`line-dest-${i}`}
            x1={`${toSvgX(selectedPlan.coordinate.lng)}%`}
            y1={`${toSvgY(selectedPlan.coordinate.lat)}%`}
            x2={`${toSvgX(dest.coordinate.lng)}%`}
            y2={`${toSvgY(dest.coordinate.lat)}%`}
            stroke={DESTINATION_COLOR}
            strokeWidth="0.5"
            strokeDasharray="4,2"
            opacity="0.6"
          />
        ))}
        
        {/* 出发点 */}
        {departures.map((dep, index) => (
          <g key={dep.id}>
            <circle
              cx={`${toSvgX(dep.coordinate.lng)}%`}
              cy={`${toSvgY(dep.coordinate.lat)}%`}
              r="3"
              fill={DEPARTURE_COLORS[index % DEPARTURE_COLORS.length]}
              stroke="white"
              strokeWidth="1"
            />
            <text
              x={`${toSvgX(dep.coordinate.lng)}%`}
              y={`${toSvgY(dep.coordinate.lat) + 6}%`}
              textAnchor="middle"
              fontSize="3"
              fill="#374151"
              fontWeight="500"
            >
              {dep.name}
            </text>
          </g>
        ))}

        {/* 目的地 */}
        {destinations.map((dest) => (
          <g key={dest.id}>
            {/* 目的地标记 - 旗帜形状 */}
            <polygon
              points={`
                ${toSvgX(dest.coordinate.lng)},${toSvgY(dest.coordinate.lat) + 4}
                ${toSvgX(dest.coordinate.lng)},${toSvgY(dest.coordinate.lat) - 4}
                ${toSvgX(dest.coordinate.lng) + 4},${toSvgY(dest.coordinate.lat) - 2}
                ${toSvgX(dest.coordinate.lng)},${toSvgY(dest.coordinate.lat)}
              `}
              fill={DESTINATION_COLOR}
              stroke="white"
              strokeWidth="0.5"
            />
            <text
              x={`${toSvgX(dest.coordinate.lng)}%`}
              y={`${toSvgY(dest.coordinate.lat) + 8}%`}
              textAnchor="middle"
              fontSize="2.5"
              fill={DESTINATION_COLOR}
              fontWeight="600"
            >
              🚩 {dest.name}
            </text>
          </g>
        ))}
        
        {/* 汇合点 */}
        {(selectedPlan ? [selectedPlan] : plans.slice(0, 3)).map((plan, index) => {
          const isSelected = selectedPlan?.id === plan.id;
          return (
            <g key={plan.id}>
              <circle
                cx={`${toSvgX(plan.coordinate.lng)}%`}
                cy={`${toSvgY(plan.coordinate.lat)}%`}
                r={isSelected ? "4" : "3"}
                fill="#22c55e"
                stroke="white"
                strokeWidth="1.5"
              />
              <text
                x={`${toSvgX(plan.coordinate.lng)}%`}
                y={`${toSvgY(plan.coordinate.lat) - 5}%`}
                textAnchor="middle"
                fontSize="2.5"
                fill="#22c55e"
                fontWeight="600"
              >
                {selectedPlan ? '🎯' : `方案${index + 1}`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 演示模式标签 */}
      <div className="absolute top-3 right-3 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
        演示模式
      </div>

      {/* 空状态 */}
      {departures.length === 0 && destinations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">添加出发点和目的地后将在这里显示</p>
          </div>
        </div>
      )}
    </div>
  );
};

const MapView: React.FC<MapViewProps> = ({
  departures,
  destinations,
  selectedPlan,
  plans,
  onMapClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);

  // 清除所有标记
  const clearMarkers = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markersRef.current.forEach((marker: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapRef.current && (mapRef.current as any).remove) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove(marker);
      }
    });
    markersRef.current = [];
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);

        // 检查是否有有效的 API Key
        const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY;
        if (!apiKey || apiKey === 'demo' || apiKey === 'your_amap_key_here') {
          console.log('No valid AMap API key, using demo mode');
          setUseDemoMode(true);
          setIsLoading(false);
          return;
        }

        // 动态导入避免 SSR 问题
        const AMapLoader = (await import('@amap/amap-jsapi-loader')).default;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap: any = await AMapLoader.load({
          key: apiKey,
          version: '2.0',
          plugins: ['AMap.Geocoder', 'AMap.Driving', 'AMap.Transfer'],
        });

        if (!containerRef.current) return;

        const map = new AMap.Map(containerRef.current, {
          zoom: 11,
          center: [116.397428, 39.90923],
          mapStyle: 'amap://styles/fresh',
        });

        mapRef.current = map;

        // 添加点击事件
        if (onMapClick) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.on('click', (e: any) => {
            onMapClick({
              lng: e.lnglat.getLng(),
              lat: e.lnglat.getLat(),
            });
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Map init error:', err);
        setUseDemoMode(true);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      clearMarkers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapRef.current && (mapRef.current as any).destroy) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).destroy();
        mapRef.current = null;
      }
    };
  }, [onMapClick, clearMarkers]);

  // 更新标记点
  useEffect(() => {
    if (!mapRef.current || isLoading || useDemoMode) return;

    const updateMarkers = async () => {
      clearMarkers();

      const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY;
      if (!apiKey || apiKey === 'demo') return;

      const AMapLoader = (await import('@amap/amap-jsapi-loader')).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AMap: any = await AMapLoader.load({
        key: apiKey,
        version: '2.0',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newMarkers: any[] = [];

      // 添加出发点标记
      departures.forEach((dep, index) => {
        const color = DEPARTURE_COLORS[index % DEPARTURE_COLORS.length];
        const marker = new AMap.Marker({
          position: [dep.coordinate.lng, dep.coordinate.lat],
          content: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                width: 32px;
                height: 32px;
                background: ${color};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <span style="
                  transform: rotate(45deg);
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                ">${index + 1}</span>
              </div>
              <div style="
                margin-top: 4px;
                padding: 2px 8px;
                background: white;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                box-shadow: 0 1px 4px rgba(0,0,0,0.2);
              ">${dep.name}</div>
            </div>
          `,
          offset: [0, 0],
        });
        
        if (mapRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mapRef.current as any).add(marker);
          newMarkers.push(marker);
        }
      });

      // 添加目的地标记
      destinations.forEach((dest) => {
        const marker = new AMap.Marker({
          position: [dest.coordinate.lng, dest.coordinate.lat],
          content: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                border: 3px solid white;
              ">
                <span style="font-size: 18px;">🚩</span>
              </div>
              <div style="
                margin-top: 4px;
                padding: 4px 12px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              ">${dest.name}</div>
            </div>
          `,
          offset: [0, 0],
        });
        
        if (mapRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mapRef.current as any).add(marker);
          newMarkers.push(marker);
        }
      });

      // 添加汇合点标记
      const plansToShow = selectedPlan ? [selectedPlan] : plans.slice(0, 3);
      plansToShow.forEach((plan, index) => {
        const isSelected = selectedPlan && selectedPlan.id === plan.id;
        const marker = new AMap.Marker({
          position: [plan.coordinate.lng, plan.coordinate.lat],
          content: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              transform: translate(-50%, -100%);
            ">
              <div style="
                width: ${isSelected ? '44px' : '36px'};
                height: ${isSelected ? '44px' : '36px'};
                background: linear-gradient(135deg, #22c55e, #16a34a);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
                border: 3px solid white;
              ">
                <span style="font-size: ${isSelected ? '20px' : '16px'};">🎯</span>
              </div>
              <div style="
                margin-top: 4px;
                padding: 4px 12px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              ">${selectedPlan ? plan.name : `方案${index + 1}`}</div>
            </div>
          `,
          offset: [0, 0],
        });
        
        if (mapRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mapRef.current as any).add(marker);
          newMarkers.push(marker);
        }
      });

      markersRef.current = newMarkers;

      // 调整视野以包含所有点
      if (newMarkers.length > 0 && mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).setFitView(newMarkers);
      }
    };

    updateMarkers();
  }, [departures, destinations, selectedPlan, plans, isLoading, useDemoMode, clearMarkers]);

  // 使用演示模式
  if (useDemoMode) {
    return (
      <DemoMap
        departures={departures}
        destinations={destinations}
        selectedPlan={selectedPlan}
        plans={plans}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 地图容器 */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-slate-600">地图加载中...</span>
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full" />
            <span className="text-slate-600">出发点</span>
          </div>
          {destinations.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center">
                <Flag className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-slate-600">目的地</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-600">汇合点</span>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      {departures.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg text-center">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">添加出发点后将在地图上显示</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MapView);

