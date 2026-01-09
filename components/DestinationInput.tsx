'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Location } from '@/types';
import { searchAddress } from '@/lib/amap';
import { debounce } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

/** 搜索结果项 */
interface SearchResultItem {
  id: string;
  name: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
}

/** 场景模式配置 */
const SCENARIO_MODES = [
  {
    value: 'meetup' as const,
    label: '单纯集合',
    icon: '🤝',
    description: '找一个大家都方便的地方碰头',
  },
  {
    value: 'destination' as const,
    label: '前往目的地',
    icon: '🎯',
    description: '在去目的地的路上找集合点',
  },
];

/** 目的地输入组件（含场景选择） */
const DestinationInput: React.FC = memo(function DestinationInput() {
  const { scenarioMode, setScenarioMode, destination, setDestination } = useAppStore();

  const [inputValue, setInputValue] = useState(destination?.name || destination?.address || '');
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 同步外部值
  useEffect(() => {
    if (destination) {
      setInputValue(destination.name || destination.address);
    } else {
      setInputValue('');
    }
  }, [destination]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索地址
  const searchPlaces = useCallback(
    debounce(async (keyword: string) => {
      if (keyword.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchAddress(keyword);
        const items: SearchResultItem[] = results
          .map((poi) => {
            const loc = poi.location;
            if (!loc) return null;
            const lng = typeof loc.getLng === 'function' ? loc.getLng() : loc.lng;
            const lat = typeof loc.getLat === 'function' ? loc.getLat() : loc.lat;
            if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
              return null;
            }
            return {
              id: poi.id,
              name: poi.name,
              address: poi.address || '',
              location: { lng, lat },
            };
          })
          .filter((item): item is SearchResultItem => item !== null);
        setSuggestions(items);
        setIsOpen(true);
      } catch (error) {
        console.error('搜索失败:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    searchPlaces(val);
  };

  // 选择建议
  const handleSelectSuggestion = (item: SearchResultItem) => {
    const location: Location = {
      coordinate: item.location,
      address: item.address,
      name: item.name,
    };
    setDestination(location);
    setInputValue(item.name);
    setIsOpen(false);
    setSuggestions([]);
  };

  // 清除输入
  const handleClear = () => {
    setInputValue('');
    setDestination(null);
    setSuggestions([]);
    setIsOpen(false);
  };

  // 切换模式时清空目的地
  const handleModeChange = (mode: 'meetup' | 'destination') => {
    setScenarioMode(mode);
    if (mode === 'meetup') {
      setDestination(null);
      setInputValue('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <span>🗺️</span>
        <span>集合场景</span>
      </h3>

      {/* 场景选择 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {SCENARIO_MODES.map((mode) => {
          const isSelected = scenarioMode === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`
                flex items-center gap-2 p-3 rounded-lg
                transition-all duration-200
                ${
                  isSelected
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }
              `}
              title={mode.description}
            >
              <span className="text-xl">{mode.icon}</span>
              <div className="text-left">
                <span
                  className={`text-sm font-medium block ${
                    isSelected ? 'text-primary' : 'text-gray-700'
                  }`}
                >
                  {mode.label}
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">
                  {mode.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 目的地输入（仅在 destination 模式显示） */}
      {scenarioMode === 'destination' && (
        <div ref={containerRef} className="relative mt-3">
          <label className="text-xs text-gray-500 mb-1.5 block">
            集合后要去的目的地
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
              🚩
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setIsOpen(true)}
              placeholder="输入目的地，如：故宫博物院"
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition-all placeholder:text-gray-400"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* 搜索建议下拉框 */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                           border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{item.address}</div>
                </button>
              ))}
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="absolute right-10 top-[calc(50%+12px)] -translate-y-1/2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* 提示信息 */}
          {destination && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                💡 将优先推荐在前往「{destination.name}」路上的集合点
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DestinationInput;


