import React, { useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { parkingAdventureMachine, services } from '../parkingAdventureMachine';
import { useVirtualHardware } from '../hooks/useVirtualHardware';

/**
 * 文字冒險遊戲 - 智慧停車場模擬器
 * 
 * 分屏設計：
 * - 左側：敘事日誌 + 互動按鈕
 * - 右側：IoT 儀表板（感測器數據、協議日誌）
 */


import React, { useEffect, useRef, useState } from 'react';
import { useMachine } from '@xstate/react';
import { parkingAdventureMachine, services } from '../parkingAdventureMachine';
import { useVirtualHardware } from '../hooks/useVirtualHardware';

// TypewriterEffect 請確認已正確引入
import TypewriterEffect from './TypewriterText';

const TextAdventureGame = () => {
  const [state, send] = useMachine(parkingAdventureMachine, { services });
  const { context } = state;
  const logEndRef = useRef(null);
  const [choiceStep, setChoiceStep] = useState('INVESTIGATE');

  // 虛擬硬體模擬
  const isAnimating = state.matches('sensing_vehicle');
  const hardware = useVirtualHardware(context.distance, isAnimating);

  // 自動滾動到日誌底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [context.narrativeLog]);

  // 進入 CHOICE_PHASE 時強制重設 choiceStep
  useEffect(() => {
    if (state.value === 'CHOICE_PHASE') {
      setChoiceStep('INVESTIGATE');
    }
  }, [state.value]);

  // Neon Button Base
  const NEON_BTN_BASE = "group relative h-48 flex flex-col items-center justify-center border-2 bg-black/80 backdrop-blur-md rounded-xl transition-all duration-300 shadow-lg hover:scale-[1.02]";
  const RED_ALERT_BTN = "px-24 py-5 border border-red-500 text-red-500 text-xl font-bold tracking-[0.2em] bg-transparent hover:bg-red-900/20 hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all duration-500 rounded-sm cursor-pointer z-50";

  // 處理三選一
  const handleEndingChoice = (type) => {
    if (type === 'CAT') send({ type: 'CHOOSE_CAT' });
    if (type === 'PASTA') send({ type: 'CHOOSE_SPAGHETTI' });
    if (type === 'EXIT') send({ type: 'CHOOSE_BOUNDARY' });
  };

  // --- CHOICE_PHASE 專屬 UI ---
  if (state.value === 'CHOICE_PHASE') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        {/* 背景效果 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-900/10 pointer-events-none" />

        {/* --- STAGE 1: INVESTIGATE --- */}
        {(choiceStep === 'INVESTIGATE' || !choiceStep) && (
          <div className="w-full h-full animate-in fade-in duration-1000">
            {/* 敘事文字：左上固定 */}
            <div className="absolute top-0 left-0 w-full p-10 z-20">
              <div className="text-left">
                <TypewriterEffect
                  text={`[主角]: 下車了。但這裡感覺... 有點不太對勁。\n[系統]: 車輛已停妥。周圍環境似乎發生了變化。`}
                  speed={30}
                />
              </div>
            </div>
            {/* 紅色大按鈕：底部中央固定 */}
            <div className="absolute bottom-24 left-0 w-full flex justify-center items-center z-30">
              <button
                onClick={() => setChoiceStep('DECIDE')}
                className={RED_ALERT_BTN}
              >
                <span className="group-hover:tracking-[0.4em] transition-all duration-300 inline-block">
                  [ 環顧四周 ]
                </span>
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 2: DECIDE --- */}
        {choiceStep === 'DECIDE' && (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-700 z-20">
            <div className="text-cyan-400/80 font-mono text-sm tracking-widest mb-8 animate-pulse">
              // 請選擇行動路徑 //
            </div>
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
              {/* Option A: Cat */}
              <button
                onClick={() => handleEndingChoice('CAT')}
                className={`${NEON_BTN_BASE} border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]`}
              >
                <div className="text-5xl mb-4 group-hover:animate-bounce">🐱</div>
                <span className="text-purple-300 font-bold text-lg tracking-widest">調查奇怪的貓咪</span>
              </button>
              {/* Option B: Pasta */}
              <button
                onClick={() => handleEndingChoice('PASTA')}
                className={`${NEON_BTN_BASE} border-yellow-500/50 hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]`}
              >
                <div className="text-5xl mb-4 group-hover:rotate-12 transition-transform">🍝</div>
                <span className="text-yellow-300 font-bold text-lg tracking-widest">查看地上的義大利麵</span>
              </button>
              {/* Option C: Exit */}
              <button
                onClick={() => handleEndingChoice('EXIT')}
                className={`${NEON_BTN_BASE} border-red-500/50 hover:border-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]`}
              >
                <div className="text-5xl mb-4 group-hover:translate-x-2 transition-transform">🚪</div>
                <span className="text-red-300 font-bold text-lg tracking-widest">走向出口離開</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ...其餘原本的 return 區塊（非 CHOICE_PHASE）...
};

export default TextAdventureGame;
