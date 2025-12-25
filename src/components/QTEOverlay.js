import React, { useEffect, useState } from 'react';
import { getArrowSymbol } from '../gameMachine';

/**
 * QTEOverlay Component - Retro RPG Style
 */
export const QTEOverlay = ({ 
  targetSequence = [], 
  currentSequence = [], 
  isActive = false,
  timeLimit = 3000
}) => {
  const [shake, setShake] = useState(false);
  const [prevLength, setPrevLength] = useState(0);

  // Detect failure (reset of sequence) to trigger shake
  useEffect(() => {
    if (isActive) {
      if (prevLength > 0 && currentSequence.length === 0) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      setPrevLength(currentSequence.length);
    } else {
      setPrevLength(0);
    }
  }, [currentSequence, isActive, prevLength]);

  if (!isActive || !targetSequence || targetSequence.length === 0) {
    return null;
  }

  const progress = currentSequence.length;
  const isComplete = progress >= targetSequence.length;
  const currentKey = isComplete ? null : targetSequence[progress];

  return (
    <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl pointer-events-none">
      <div className={`${shake ? 'animate-shake' : ''} pointer-events-auto flex flex-col items-center justify-center`}>
        
        {/* Single Large Card Display */}
        <div className={`
          relative flex items-center justify-center
          w-64 h-64 
          rpg-bg-main
          rpg-border
          mb-8
          ${isComplete ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-200
        `}>
           {!isComplete && (
             <div className="text-[8rem] text-rpg-yellow font-black leading-none text-shadow-lg">
               {getArrowSymbol(currentKey)}
             </div>
           )}
        </div>

        {/* Progress Indicators (Squares instead of dots) */}
        <div className="flex gap-4 mb-8">
          {targetSequence.map((_, index) => (
            <div 
              key={index}
              className={`
                w-8 h-8 border-2 border-white transition-all duration-100
                ${index < progress ? 'bg-green-500' : 
                  index === progress ? 'bg-yellow-400 animate-pulse' : 
                  'bg-gray-800'}
              `}
            />
          ))}
        </div>

        {/* Timer Bar */}
        {isActive && !isComplete && !shake && (
          <div className="w-96 mx-auto mb-8">
            <div className="h-8 bg-black border-4 border-white relative p-1">
              <div 
                key={progress}
                className="h-full bg-red-600 absolute top-1 left-1 bottom-1"
                style={{ 
                  width: 'calc(100% - 8px)', 
                  animation: `shrink ${timeLimit}ms linear forwards` 
                }}
              />
            </div>
          </div>
        )}
        <style>{`
          @keyframes shrink {
            from { width: calc(100% - 8px); }
            to { width: 0%; }
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%, 90% { transform: translate3d(-4px, 0, 0); }
            20%, 80% { transform: translate3d(8px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-16px, 0, 0); }
            40%, 60% { transform: translate3d(16px, 0, 0); }
          }
          .text-shadow-lg {
            text-shadow: 4px 4px 0 #000;
          }
        `}</style>

        {/* Status Text */}
        <div className="text-center h-24">
          {isComplete ? (
            <span className="text-rpg-green text-4xl animate-bounce inline-block text-shadow-lg">
              成功!
            </span>
          ) : shake ? (
            <span className="text-rpg-red text-4xl animate-shake inline-block text-shadow-lg">
              失誤!
            </span>
          ) : (
            <span className="text-white text-2xl tracking-widest text-shadow-lg">
              輸入指令
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default QTEOverlay;
