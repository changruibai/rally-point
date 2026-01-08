'use client';

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Location, Coordinate } from '@/types';
import { searchAddress, getCurrentPosition, reverseGeocode } from '@/lib/amap';
import { debounce } from '@/lib/utils';

/** LocationInput Props */
interface LocationInputProps {
  value: Location | null;
  onChange: (location: Location) => void;
  placeholder?: string;
  participantColor?: string;
}

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

/** 位置输入组件 */
const LocationInput: React.FC<LocationInputProps> = memo(function LocationInput({
  value,
  onChange,
  placeholder = '搜索地点或点击地图选点',
  participantColor = '#3498DB',
}) {
  const [inputValue, setInputValue] = useState(value?.name || value?.address || '');
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 同步外部值
  useEffect(() => {
    if (value) {
      setInputValue(value.name || value.address);
    } else {
      setInputValue('');
    }
  }, [value]);

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
            // 高德地图 LngLat 对象可能需要使用方法或属性获取值
            const loc = poi.location;
            if (!loc) return null;
            const lng = typeof loc.getLng === 'function' ? loc.getLng() : loc.lng;
            const lat = typeof loc.getLat === 'function' ? loc.getLat() : loc.lat;
            // 验证坐标有效性
            if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
              console.warn('搜索结果坐标无效:', poi.name, loc);
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
    onChange(location);
    setInputValue(item.name);
    setIsOpen(false);
    setSuggestions([]);
  };

  // 获取当前位置
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coord = await getCurrentPosition();
      const address = await reverseGeocode(coord);
      const location: Location = {
        coordinate: coord,
        address,
        name: '当前位置',
      };
      onChange(location);
      setInputValue('当前位置');
    } catch (error) {
      console.error('获取位置失败:', error);
      alert('获取当前位置失败，请检查定位权限');
    } finally {
      setIsLocating(false);
    }
  };

  // 清除输入
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        {/* 输入框 */}
        <div className="relative flex-1">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: participantColor }}
          >
            📍
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
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

        {/* 定位按钮 */}
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="获取当前位置"
        >
          {isLocating ? (
            <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          ) : (
            <span className="text-lg">📌</span>
          )}
        </button>
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
        <div className="absolute right-14 top-1/2 -translate-y-1/2">
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

export default LocationInput;

