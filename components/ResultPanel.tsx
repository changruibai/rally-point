'use client';

import React, { memo } from 'react';
import { useAppStore, useSelectedPlan } from '@/store/useAppStore';
import { formatDuration, formatDistance, getPOIIcon, TRANSPORT_ICONS } from '@/lib/utils';

/** 结果面板组件 */
const ResultPanel: React.FC = memo(function ResultPanel() {
  const {
    bestPlan,
    alternatives,
    selectedPlanIndex,
    setSelectedPlanIndex,
    participants,
    setHoveredParticipantId,
  } = useAppStore();

  const selectedPlan = useSelectedPlan();

  if (!selectedPlan) return null;

  // 所有方案
  const allPlans = bestPlan ? [bestPlan, ...alternatives] : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🎯</span>
          <span>推荐集合点</span>
        </h2>
      </div>

      {/* 方案切换 */}
      {allPlans.length > 1 && (
        <div className="flex border-b border-gray-100">
          {allPlans.map((plan, index) => (
            <button
              key={plan.poi.id}
              onClick={() => setSelectedPlanIndex(index)}
              className={`
                flex-1 py-3 text-sm font-medium transition-colors
                ${
                  selectedPlanIndex === index
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {index === 0 ? '最佳方案' : `备选 ${index}`}
            </button>
          ))}
        </div>
      )}

      {/* 集合点信息 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl">
            {getPOIIcon(selectedPlan.poi.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{selectedPlan.poi.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{selectedPlan.poi.location.address}</p>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">最长等待</div>
            <div className="text-lg font-semibold text-primary">
              {Math.round(selectedPlan.maxDuration)}
              <span className="text-xs font-normal text-gray-500 ml-0.5">分钟</span>
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">平均时间</div>
            <div className="text-lg font-semibold text-gray-800">
              {Math.round(selectedPlan.avgDuration)}
              <span className="text-xs font-normal text-gray-500 ml-0.5">分钟</span>
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">时间差</div>
            <div className="text-lg font-semibold text-gray-800">
              {Math.round(selectedPlan.maxDuration - selectedPlan.minDuration)}
              <span className="text-xs font-normal text-gray-500 ml-0.5">分钟</span>
            </div>
          </div>
        </div>
      </div>

      {/* 每人到达时间 */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">各参与者到达时间</h4>
        <div className="space-y-2">
          {selectedPlan.routes.map((route) => {
            const participant = participants.find((p) => p.id === route.participantId);
            if (!participant) return null;

            return (
              <div
                key={route.participantId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg
                         hover:bg-gray-100 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredParticipantId(route.participantId)}
                onMouseLeave={() => setHoveredParticipantId(null)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participants.findIndex((p) => p.id === participant.id) + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{participant.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{TRANSPORT_ICONS[participant.transportMode]}</span>
                      <span>{formatDistance(route.distance)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold" style={{ color: participant.color }}>
                    {formatDuration(route.duration)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ResultPanel;



