'use client';

import React, { memo } from 'react';
import { TransportMode } from '@/types';
import { TRANSPORT_ICONS, TRANSPORT_NAMES } from '@/lib/utils';

/** TransportSelect Props */
interface TransportSelectProps {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
  participantColor?: string;
}

/** 交通方式选项 */
const TRANSPORT_OPTIONS: TransportMode[] = ['walking', 'cycling', 'transit', 'driving'];

/** 交通方式选择组件 */
const TransportSelect: React.FC<TransportSelectProps> = memo(function TransportSelect({
  value,
  onChange,
  participantColor = '#3498DB',
}) {
  return (
    <div className="flex gap-1">
      {TRANSPORT_OPTIONS.map((mode) => {
        const isSelected = value === mode;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
              transition-all duration-200
              ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            style={isSelected ? { backgroundColor: participantColor } : undefined}
            title={TRANSPORT_NAMES[mode]}
          >
            <span>{TRANSPORT_ICONS[mode]}</span>
            <span className="hidden sm:inline">{TRANSPORT_NAMES[mode]}</span>
          </button>
        );
      })}
    </div>
  );
});

export default TransportSelect;

