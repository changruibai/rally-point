'use client';

import React, { memo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { calculateMeetingPoint } from '@/lib/api';

/** 计算按钮组件 */
const CalculateButton: React.FC = memo(function CalculateButton() {
  const {
    participants,
    selectedPOITypes,
    strategy,
    scenarioMode,
    destination,
    isCalculating,
    calculationProgress,
    setCalculating,
    setResults,
    clearResults,
  } = useAppStore();

  // 检查是否可以计算
  const validParticipants = participants.filter((p) => p.location !== null);
  const needsDestination = scenarioMode === 'destination' && !destination;
  const canCalculate = validParticipants.length >= 2 && !isCalculating && !needsDestination;

  // 执行计算
  const handleCalculate = useCallback(async () => {
    if (!canCalculate) return;

    clearResults();
    setCalculating(true, '正在初始化...');

    try {
      const result = await calculateMeetingPoint(
        participants,
        selectedPOITypes,
        strategy,
        (progress) => setCalculating(true, progress),
        scenarioMode,
        destination
      );

      setResults(result.bestPlan, result.alternatives, result.searchCenter);
    } catch (error) {
      console.error('计算失败:', error);
      setCalculating(false);
      alert(error instanceof Error ? error.message : '计算失败，请稍后重试');
    }
  }, [
    participants,
    selectedPOITypes,
    strategy,
    scenarioMode,
    destination,
    canCalculate,
    clearResults,
    setCalculating,
    setResults,
  ]);

  return (
    <div>
      <button
        onClick={handleCalculate}
        disabled={!canCalculate}
        className={`
          w-full py-4 rounded-xl font-semibold text-white
          transition-all duration-300 transform
          flex items-center justify-center gap-2
          ${
            canCalculate
              ? 'bg-gradient-to-r from-primary to-primary-light hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }
        `}
      >
        {isCalculating ? (
          <>
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{calculationProgress || '计算中...'}</span>
          </>
        ) : (
          <>
            <span className="text-xl">🎯</span>
            <span>计算最佳集合点</span>
          </>
        )}
      </button>

      {/* 提示信息 */}
      {validParticipants.length < 2 && (
        <p className="text-center text-sm text-gray-500 mt-2">
          请至少设置 2 个参与者的位置
        </p>
      )}
      {validParticipants.length >= 2 && needsDestination && (
        <p className="text-center text-sm text-amber-600 mt-2">
          🚩 请设置目的地后再计算
        </p>
      )}
    </div>
  );
});

export default CalculateButton;

