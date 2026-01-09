'use client';

import React, { memo } from 'react';
import { useAppStore, useSelectedPlan } from '@/store/useAppStore';
import ParticipantCard from './ParticipantCard';

/** 参与者列表组件 */
const ParticipantList: React.FC = memo(function ParticipantList() {
  const {
    participants,
    addParticipant,
    removeParticipant,
    updateParticipantLocation,
    updateParticipantTransport,
    updateParticipantName,
    setHoveredParticipantId,
  } = useAppStore();

  const selectedPlan = useSelectedPlan();

  // 获取参与者的到达时间
  const getArrivalTime = (participantId: string): number | undefined => {
    if (!selectedPlan) return undefined;
    const route = selectedPlan.routes.find((r) => r.participantId === participantId);
    return route?.duration;
  };

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>👥</span>
          <span>参与者</span>
          <span className="text-sm font-normal text-gray-500">
            ({participants.length}/8)
          </span>
        </h2>
      </div>

      {/* 参与者卡片列表 */}
      <div className="space-y-3">
        {participants.map((participant, index) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            index={index}
            canDelete={participants.length > 2}
            onLocationChange={(location) =>
              updateParticipantLocation(participant.id, location)
            }
            onTransportChange={(mode) =>
              updateParticipantTransport(participant.id, mode)
            }
            onNameChange={(name) =>
              updateParticipantName(participant.id, name)
            }
            onDelete={() => removeParticipant(participant.id)}
            onHover={(isHovered) =>
              setHoveredParticipantId(isHovered ? participant.id : null)
            }
            arrivalTime={getArrivalTime(participant.id)}
          />
        ))}
      </div>

      {/* 添加参与者按钮 */}
      {participants.length < 8 && (
        <button
          onClick={addParticipant}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl
                   text-gray-500 hover:border-primary hover:text-primary
                   transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>添加参与者</span>
        </button>
      )}
    </div>
  );
});

export default ParticipantList;


