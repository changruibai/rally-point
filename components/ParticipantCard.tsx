'use client';

import React, { memo } from 'react';
import { Participant, Location, TransportMode } from '@/types';
import LocationInput from './LocationInput';
import TransportSelect from './TransportSelect';

/** ParticipantCard Props */
interface ParticipantCardProps {
  participant: Participant;
  index: number;
  canDelete: boolean;
  onLocationChange: (location: Location) => void;
  onTransportChange: (mode: TransportMode) => void;
  onNameChange: (name: string) => void;
  onDelete: () => void;
  onHover: (isHovered: boolean) => void;
  arrivalTime?: number;
}

/** 单个参与者卡片 */
const ParticipantCard: React.FC<ParticipantCardProps> = memo(function ParticipantCard({
  participant,
  index,
  canDelete,
  onLocationChange,
  onTransportChange,
  onNameChange,
  onDelete,
  onHover,
  arrivalTime,
}) {
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 
               hover:shadow-md transition-shadow duration-200 animate-fade-in"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* 头部：名称和删除按钮 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* 颜色指示器 */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: participant.color }}
          >
            {index + 1}
          </div>
          {/* 名称输入 */}
          <input
            type="text"
            value={participant.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="font-medium text-gray-800 bg-transparent border-none outline-none
                     focus:bg-gray-50 focus:px-2 rounded transition-all w-24"
            maxLength={10}
          />
        </div>
        {/* 删除按钮 */}
        {canDelete && (
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-full
                     text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除参与者"
          >
            ✕
          </button>
        )}
      </div>

      {/* 位置输入 */}
      <div className="mb-3">
        <LocationInput
          value={participant.location}
          onChange={onLocationChange}
          participantColor={participant.color}
        />
      </div>

      {/* 交通方式选择 */}
      <div className="flex items-center justify-between">
        <TransportSelect
          value={participant.transportMode}
          onChange={onTransportChange}
          participantColor={participant.color}
        />

        {/* 到达时间显示 */}
        {typeof arrivalTime === 'number' && (
          <div className="text-sm">
            <span className="text-gray-500">预计 </span>
            <span className="font-semibold" style={{ color: participant.color }}>
              {Math.round(arrivalTime)} 分钟
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ParticipantCard;


