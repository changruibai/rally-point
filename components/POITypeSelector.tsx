'use client';

import React, { memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { POIType } from '@/types';
import { POI_TYPE_ICONS, POI_TYPE_NAMES } from '@/lib/utils';

/** POI 类型选项 */
const POI_OPTIONS: POIType[] = ['restaurant', 'cafe', 'subway', 'mall', 'parking'];

/** POI 类型选择器组件 */
const POITypeSelector: React.FC = memo(function POITypeSelector() {
  const { selectedPOITypes, setSelectedPOITypes } = useAppStore();

  const toggleType = (type: POIType) => {
    if (selectedPOITypes.includes(type)) {
      // 至少保留一个类型
      if (selectedPOITypes.length > 1) {
        setSelectedPOITypes(selectedPOITypes.filter((t) => t !== type));
      }
    } else {
      setSelectedPOITypes([...selectedPOITypes, type]);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <span>🎯</span>
        <span>集合点类型</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {POI_OPTIONS.map((type) => {
          const isSelected = selectedPOITypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                transition-all duration-200
                ${
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span>{POI_TYPE_ICONS[type]}</span>
              <span>{POI_TYPE_NAMES[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default POITypeSelector;

