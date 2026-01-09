'use client';

import React, { memo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CuisineType, TastePreference } from '@/types';
import {
  CUISINE_TYPE_ICONS,
  CUISINE_TYPE_NAMES,
  TASTE_ICONS,
  TASTE_NAMES,
} from '@/lib/utils';

/** 菜系选项 */
const CUISINE_OPTIONS: CuisineType[] = [
  'chinese',
  'western',
  'japanese',
  'korean',
  'hotpot',
  'bbq',
  'fastfood',
  'dessert',
];

/** 口味选项 */
const TASTE_OPTIONS: TastePreference[] = [
  'light',
  'spicy',
  'sour',
  'sweet',
  'salty',
  'vegetarian',
];

/** 评分选项 */
const RATING_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 3.5, label: '3.5+' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

/** 饮食偏好选择器组件 */
const FoodPreferenceSelector: React.FC = memo(function FoodPreferenceSelector() {
  const {
    selectedCuisines,
    setSelectedCuisines,
    selectedTastes,
    setSelectedTastes,
    minRating,
    setMinRating,
    selectedPOITypes,
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(true);

  // 只有当选择了餐饮相关的 POI 类型时才显示饮食偏好
  const showFoodPreferences = selectedPOITypes.some((type) =>
    ['restaurant', 'cafe'].includes(type)
  );

  if (!showFoodPreferences) {
    return null;
  }

  // 是否选中全部菜系
  const isAllCuisinesSelected = selectedCuisines.length === CUISINE_OPTIONS.length;
  // 是否选中全部口味（不限）
  const isNoTasteSelected = selectedTastes.length === 0;

  const toggleAllCuisines = () => {
    if (isAllCuisinesSelected) {
      // 如果已经全选，则只保留第一个
      setSelectedCuisines([CUISINE_OPTIONS[0]]);
    } else {
      // 否则全选
      setSelectedCuisines([...CUISINE_OPTIONS]);
    }
  };

  const toggleCuisine = (cuisine: CuisineType) => {
    if (selectedCuisines.includes(cuisine)) {
      // 至少保留一个菜系
      if (selectedCuisines.length > 1) {
        setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
      }
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  const clearAllTastes = () => {
    setSelectedTastes([]);
  };

  const toggleTaste = (taste: TastePreference) => {
    if (selectedTastes.includes(taste)) {
      setSelectedTastes(selectedTastes.filter((t) => t !== taste));
    } else {
      setSelectedTastes([...selectedTastes, taste]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span>🍽️</span>
          <span>饮食偏好</span>
          {(selectedCuisines.length > 0 || selectedTastes.length > 0) && (
            <span className="text-xs text-gray-400">
              ({isAllCuisinesSelected ? '全部菜系' : `${selectedCuisines.length}种菜系`}
              {selectedTastes.length > 0 && `, ${selectedTastes.length}种口味`})
            </span>
          )}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 菜系选择 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">偏好菜系</label>
            <div className="flex flex-wrap gap-2">
              {/* 全部选项 */}
              <button
                onClick={toggleAllCuisines}
                className={`
                  flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                  transition-all duration-200 border
                  ${
                    isAllCuisinesSelected
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span>🍴</span>
                <span>全部</span>
              </button>
              {CUISINE_OPTIONS.map((cuisine) => {
                const isSelected = selectedCuisines.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    onClick={() => toggleCuisine(cuisine)}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                      transition-all duration-200 border
                      ${
                        isSelected
                          ? 'bg-orange-50 border-orange-300 text-orange-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span>{CUISINE_TYPE_ICONS[cuisine]}</span>
                    <span>{CUISINE_TYPE_NAMES[cuisine]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 口味偏好 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">口味偏好 (可选)</label>
            <div className="flex flex-wrap gap-2">
              {/* 不限选项 */}
              <button
                onClick={clearAllTastes}
                className={`
                  flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                  transition-all duration-200 border
                  ${
                    isNoTasteSelected
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span>🎲</span>
                <span>不限</span>
              </button>
              {TASTE_OPTIONS.map((taste) => {
                const isSelected = selectedTastes.includes(taste);
                return (
                  <button
                    key={taste}
                    onClick={() => toggleTaste(taste)}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                      transition-all duration-200 border
                      ${
                        isSelected
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span>{TASTE_ICONS[taste]}</span>
                    <span>{TASTE_NAMES[taste]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 最低评分 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">最低评分</label>
            <div className="flex gap-2">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMinRating(option.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border
                    ${
                      minRating === option.value
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {option.value > 0 && <span className="mr-1">⭐</span>}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FoodPreferenceSelector;

