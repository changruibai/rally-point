'use client';

import React, { memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CalculateStrategy } from '@/types';

/** 策略选项配置 */
const STRATEGY_OPTIONS: {
  value: CalculateStrategy;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: 'fair',
    label: '公平优先',
    icon: '⚖️',
    description: '让等待最久的人时间最短',
  },
  {
    value: 'balanced',
    label: '平衡策略',
    icon: '🎯',
    description: '综合考虑时间和公平性',
  },
  {
    value: 'efficient',
    label: '效率优先',
    icon: '⚡',
    description: '总出行时间最短',
  },
];

/** 策略选择器组件 */
const StrategySelector: React.FC = memo(function StrategySelector() {
  const { strategy, setStrategy } = useAppStore();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <span>⚙️</span>
        <span>优化策略</span>
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {STRATEGY_OPTIONS.map((option) => {
          const isSelected = strategy === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setStrategy(option.value)}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg
                transition-all duration-200 text-center
                ${
                  isSelected
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }
              `}
              title={option.description}
            >
              <span className="text-xl">{option.icon}</span>
              <span
                className={`text-xs font-medium ${
                  isSelected ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default StrategySelector;

