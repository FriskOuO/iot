import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { qteGameMachine, getArrowSymbol } from '../qteGameMachine';
import { useKeyboardSequence } from '../hooks/useKeyboardSequence';
import QTEOverlay from './QTEOverlay';

/**
 * QTE 冒險遊戲主組件 - Retro RPG Style
 * Layout: Grid Layout matching the screenshot
 * 1920x1080 Full Screen
 */

const QTEGame = () => {
  const [state, send] = useMachine(qteGameMachine);
  const { context } = state;
  const logEndRef = useRef(null);

  // 判斷當前是否處於 QTE 狀態
  const isDrivingTutorial = state.matches('drivingTutorial');
  const isEngineStart = state.matches('startingEngine') || state.matches('restartingEngine');
  const isQTEActive = isDrivingTutorial || isEngineStart;

  // 根據狀態決定 QTE 參數
  const targetSequence = useMemo(() => {
    return isDrivingTutorial 
      ? (context.currentKey ? [context.currentKey] : []) 
      : context.targetSequence;
  }, [isDrivingTutorial, context.currentKey, context.targetSequence]);
    
  const currentSequence = isDrivingTutorial 
    ? [] 
    : context.currentSequence;

  const timeLimit = isDrivingTutorial 
    ? context.drivingQteTimeLimit 
    : 3000;
  
  useKeyboardSequence({
    targetSequence,
    currentSequence,
    onKeyPress: (key, isError) => {
      if (isEngineStart) {
        if (isError) {
          send({ type: 'RESET_SEQUENCE' });
        } else {
          send({ type: 'KEY_PRESS', key });
          if (context.currentSequence.length + 1 === context.targetSequence.length) {
            setTimeout(() => {
              send({ type: 'QTE_SUCCESS' });
            }, 200);
          }
        }
      } else if (isDrivingTutorial) {
        send({ type: 'KEY_PRESS', key });
      }
    },
    onSuccess: () => {
      if (isEngineStart) {
        send({ type: 'QTE_SUCCESS' });
      }
    },
    onFail: () => {
      send({ type: 'QTE_FAIL' });
    },
    isActive: isQTEActive,
    timeLimit: timeLimit
  });

  // 自動滾動日誌
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [context.narrativeLog]);

  // 渲染日誌條目
  const renderLogEntry = (entry, index) => {
    const colorClass = {
      system: 'text-rpg-green',
      narrator: 'text-rpg-cyan',
      player: 'text-rpg-yellow'
    }[entry.type] || 'text-rpg-white';

    return (
      <div key={index} className={`mb-2 ${colorClass} text-sm leading-relaxed`}>
        {entry.type === 'system' && '> '}
        {entry.type === 'player' && '* '}
        {entry.text}
      </div>
    );
  };

  // 渲染操作按鈕
  const renderActionButtons = () => {
    if (state.matches('idle')) {
      return (
        <button onClick={() => send({ type: 'ENTER_CAR' })} className="rpg-btn p-2 text-xs">
          進入車輛
        </button>
      );
    }

    if (state.matches('inCar')) {
      return (
        <div className="text-gray-400 text-xs blink">系統載入中...</div>
      );
    }
    
    if (state.matches('tutorialIntro')) {
       return (
        <div className="text-rpg-yellow blink">教學模式啟動中...</div>
       );
    }

    if (state.matches('carStalled')) {
      return (
        <button onClick={() => send({ type: 'RESTART_ENGINE' })} className="rpg-btn p-2 text-xs bg-red-900">
          重新啟動引擎
        </button>
      );
    }

    if (state.matches('atGate')) {
      return (
        <button onClick={() => send({ type: 'OPEN_GATE' })} className="rpg-btn p-2 text-xs">
          開啟柵欄
        </button>
      );
    }

    if (state.matches('gateOpen')) {
      return (
        <button onClick={() => send({ type: 'PARK_CAR' })} className="rpg-btn p-2 text-xs">
          停車
        </button>
      );
    }

    if (state.matches('parked')) {
      return (
        <button onClick={() => send({ type: 'RESTART' })} className="rpg-btn p-2 text-xs">
          重新開始
        </button>
      );
    }

    return null;
  };

  return (
    <div className="w-screen h-screen bg-black text-white p-4 overflow-hidden grid grid-cols-[1fr_400px] grid-rows-[1fr_250px] gap-4">
      
      {/* Top Left: Game Visual Area (Image) */}
      <div className="rpg-panel-gray relative flex items-center justify-center overflow-hidden col-start-1 row-start-1">
           {/* QTE Overlay contained within the game view */}
           <div className="absolute inset-0 z-10">
             <QTEOverlay
                targetSequence={targetSequence}
                currentSequence={currentSequence}
                timeLimit={timeLimit / 1000}
                isActive={isQTEActive}
              />
           </div>

           {/* Placeholder for Game Graphics */}
           <div className="text-center opacity-50">
              <h1 className="text-4xl text-rpg-yellow mb-4 text-shadow">圖片</h1>
              <div className="text-6xl mb-4">🚗 🅿️</div>
              <p className="text-xl text-rpg-cyan">
                狀態: <span className="text-white">{state.value.toString().toUpperCase()}</span>
              </p>
           </div>
      </div>

      {/* Bottom Left: Dialogue Box (Text) */}
      <div className="rpg-dialogue-box p-6 flex flex-col col-start-1 row-start-2">
          {/* Corner Decorations */}
          <div className="rpg-corner-square sq-tl"></div>
          <div className="rpg-corner-square sq-tr"></div>
          <div className="rpg-corner-square sq-bl"></div>
          <div className="rpg-corner-square sq-br"></div>

          <h2 className="text-sm text-rpg-green mb-2 border-b-2 border-gray-600 pb-1">
            文字
          </h2>
          
          {/* Story Log */}
          <div className="flex-1 overflow-y-auto mb-2 pr-2 custom-scrollbar">
            {context.narrativeLog.map((entry, i) => renderLogEntry(entry, i))}
            <div ref={logEndRef} />
          </div>

          {/* Action Buttons */}
          <div className="border-t-2 border-gray-600 pt-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-rpg-cyan mr-2">指令:</span>
              {renderActionButtons()}
            </div>
          </div>
      </div>

      {/* Right Column: Engineering Dashboard (Status) - Spans both rows */}
      <div className="rpg-panel-gray p-4 flex flex-col overflow-hidden col-start-2 row-span-2">
        <h2 className="text-lg text-rpg-cyan mb-4 border-b-4 border-black pb-2 text-center">
          狀態
        </h2>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {/* Vehicle Status Panel */}
          <div className="mb-6 border-2 border-black bg-gray-800 p-4 rounded">
            <h3 className="text-rpg-yellow text-sm mb-2">車輛狀況</h3>
            <div className="grid grid-cols-1 gap-4">
               <div>
                 <div className="flex justify-between mb-1 text-xs">
                   <span>耐久度</span>
                   <span>{context.carDurability}%</span>
                 </div>
                 <div className="w-full h-4 border-2 border-white bg-black p-0.5">
                    <div 
                      className={`h-full ${
                        context.carDurability > 50 ? 'bg-green-500' : context.carDurability > 20 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${context.carDurability}%` }}
                    />
                 </div>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs">引擎</span>
                 <span className={`text-sm ${context.engineRunning ? 'text-rpg-green blink' : 'text-rpg-red'}`}>
                    {context.engineRunning ? '運轉中' : '已熄火'}
                 </span>
               </div>
            </div>
          </div>

          {/* Distance Sensor */}
          <div className="mb-6 border-2 border-black bg-gray-800 p-4 rounded">
            <h3 className="text-rpg-yellow text-sm mb-2">感測器: HC-SR04</h3>
            <div className="text-center">
              <div className="text-2xl text-rpg-green mb-2">
                {context.distance.toFixed(0)} <span className="text-sm">CM</span>
              </div>
              <div className="w-full h-4 border-2 border-white bg-black p-0.5">
                <div 
                  className={`h-full ${
                    context.distance <= 50 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.max(5, (1000 - context.distance) / 10)}%` }}
                />
              </div>
            </div>
          </div>

          {/* QTE Status */}
          {isQTEActive && (
            <div className="mb-6 border-2 border-purple-500 p-4 bg-purple-900 bg-opacity-20 rounded">
              <h3 className="text-purple-300 text-sm mb-2">QTE 監控</h3>
              <div className="space-y-2 text-xs">
                {isDrivingTutorial ? (
                   <>
                    <div className="flex justify-between">
                      <span>輸入:</span>
                      <span className="text-rpg-yellow text-lg">
                        {getArrowSymbol(context.currentKey)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>連擊:</span>
                      <span className="text-rpg-green">{context.consecutiveSuccesses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>時限:</span>
                      <span className="text-rpg-cyan">{context.drivingQteTimeLimit}ms</span>
                    </div>
                   </>
                ) : (
                   <>
                    <div className="flex justify-between">
                      <span>目標:</span>
                      <span className="text-rpg-yellow">
                        {context.targetSequence.map(k => getArrowSymbol(k)).join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>當前:</span>
                      <span className="text-rpg-green">
                        {context.currentSequence.map(k => getArrowSymbol(k)).join(' ')}
                      </span>
                    </div>
                   </>
                )}
              </div>
            </div>
          )}

          {/* MQTT Logs */}
          <div className="mb-6 border-2 border-black bg-gray-800 p-4 rounded">
            <h3 className="text-rpg-yellow text-sm mb-2">MQTT 日誌</h3>
            <div className="h-32 overflow-y-auto custom-scrollbar text-xs space-y-2">
              {context.mqttLogs.length === 0 ? (
                <div className="text-gray-500">無數據...</div>
              ) : (
                context.mqttLogs.map((log, i) => (
                  <div key={i} className="border-b border-gray-700 pb-1">
                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <br/>
                    <span className="text-rpg-cyan">{log.topic}</span>
                    <br/>
                    <span className="text-rpg-green">{JSON.stringify(log.payload)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .blink {
          animation: blinker 1s linear infinite;
        }
        @keyframes blinker {
          50% { opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000; 
          border-left: 2px solid #fff;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fff; 
          border: 2px solid #000;
        }
        .text-shadow {
          text-shadow: 2px 2px 0 #000;
        }
      `}</style>
    </div>
  );
};

export default QTEGame;
