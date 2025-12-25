import React, { useEffect, useCallback } from 'react';

/**
 * Custom Hook: useActionInput
 * Handles both mouse clicks and keyboard number keys (1-9)
 */
export const useActionInput = (options, onSelect) => {
  const handleKeyPress = useCallback((event) => {
    const key = event.key;
    const numKey = parseInt(key);
    
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
      const index = numKey - 1;
      if (options[index] && !options[index].disabled) {
        event.preventDefault();
        onSelect(options[index].action);
      }
    }
  }, [options, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};

/**
 * ActionButton Component
 * Single action button with hotkey, icon, and text
 */
const ActionButton = ({ option, index, onClick, icon }) => {
  const IconComponent = icon;
  
  return (
    <button
      onClick={() => !option.disabled && onClick(option.action)}
      disabled={option.disabled}
      className={`
        w-full flex items-center gap-4 p-4 rounded-lg border-2
        transition hover:scale-105
        ${option.disabled 
          ? 'bg-zinc-900 border-zinc-700 opacity-50 cursor-not-allowed' 
          : 'bg-zinc-800 border-green-500 hover:bg-zinc-700 cursor-pointer'}
      `}
    >
      {/* Hot Key */}
      <span className="text-2xl font-bold text-yellow-400 min-w-[40px]">
        [{index + 1}]
      </span>

      {/* Icon */}
      {IconComponent && (
        <IconComponent 
          className={option.disabled ? 'text-zinc-600' : 'text-green-400'} 
          size={24} 
        />
      )}

      {/* Action Text */}
      <span className={`text-lg font-mono ${option.disabled ? 'text-zinc-600' : 'text-green-400'}`}>
        {option.label}
      </span>
    </button>
  );
};

/**
 * StatusBar Component
 * Shows current state and engine status
 */
const StatusBar = ({ currentState, engineRunning, distance }) => {
  return (
    <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 border-b border-zinc-700">
      <div className="flex gap-4">
        <span className="text-cyan-400 text-sm">
          STATE: <span className="font-bold">{currentState.toUpperCase()}</span>
        </span>
        <span className="text-yellow-400 text-sm">
          ENGINE: <span className="font-bold">{engineRunning ? 'ON' : 'OFF'}</span>
        </span>
      </div>
      <div className="text-green-400 text-sm">
        DISTANCE: <span className="font-bold">{distance} cm</span>
      </div>
    </div>
  );
};

/**
 * ActionMenu Component
 * Main interaction deck with status bar and choice buttons
 */
export const ActionMenu = ({ 
  options, 
  onSelect, 
  currentState, 
  engineRunning, 
  distance 
}) => {
  useActionInput(options, onSelect);

  return (
    <div 
      className="bg-zinc-800 border-t-2 border-green-500"
      style={{ height: '30vh' }}
    >
      <StatusBar 
        currentState={currentState} 
        engineRunning={engineRunning}
        distance={distance}
      />
      
      <div className="p-4 flex flex-col gap-2 overflow-y-auto" style={{ height: 'calc(30vh - 45px)' }}>
        {options.length === 0 ? (
          <div className="text-zinc-400 text-center py-8">
            No actions available
          </div>
        ) : (
          options.map((option, index) => (
            <ActionButton
              key={index}
              option={option}
              index={index}
              onClick={onSelect}
              icon={option.icon}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Icon placeholders (will be replaced with lucide-react)
export const CarIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>🚗</span>
);

export const EyeIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>👁️</span>
);

export const PlayIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>▶️</span>
);

export const LogOutIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>🚪</span>
);

export const ZapIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>⚡</span>
);

export const MoveIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>➡️</span>
);

export const TicketIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>🎫</span>
);

export const ChevronsUpIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>⬆️</span>
);

export const RefreshCwIcon = ({ className, size }) => (
  <span className={className} style={{ fontSize: size }}>🔄</span>
);
