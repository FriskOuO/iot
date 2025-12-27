import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import './components/CyberpunkUI.css'; // New Cyberpunk Styles
import './components/StoryMode.css'; // Story Mode Styles
import { parkingGameMachine } from './gameMachine';
import { SceneDisplay } from './components/HybridUI'; // Reuse SceneDisplay for now
import CyberpunkDashboard from './components/CyberpunkDashboard';
import VirtualMobile from './components/VirtualMobile';
import ManualDrivingConsole from './components/ManualDrivingConsole';
import { useDrivingMechanic } from './hooks/useDrivingMechanic';

// --- Helper Functions ---

const getSpeakerColor = (speaker) => {
  if (speaker.includes('系統')) return '#4ade80'; // green-400
  if (speaker.includes('車載智能')) return '#22d3ee'; // cyan-400
  if (speaker.includes('主角')) return '#facc15'; // yellow-400
  if (speaker.includes('神秘人') || speaker.includes('未知聲音')) return '#c084fc'; // purple-400
  if (speaker.includes('動作') || speaker.includes('聲音') || speaker.includes('音樂')) return '#9ca3af'; // gray-400
  return '#e5e7eb'; // gray-200
};

const parseTextToSegments = (fullText) => {
  const segments = [];
  const lines = fullText.split('\n');
  
  lines.forEach((line, i) => {
    const match = line.match(/^(\[[^\]]+\]):\s*(.*)/);
    if (match) {
      const speaker = match[1];
      const content = match[2];
      segments.push({ 
        text: `${speaker}: `, 
        color: getSpeakerColor(speaker),
        newLine: false 
      });
      segments.push({ 
        text: content, 
        color: '#e5e7eb', 
        newLine: true 
      });
    } else {
      segments.push({ 
        text: line, 
        color: '#e5e7eb', 
        newLine: true 
      });
    }
  });
  return segments;
};

// --- Typewriter Component ---

const TypewriterText = ({ text, context, onComplete, forceShowFull, isDrivingActive, onUpdate }) => {
  const [globalIndex, setGlobalIndex] = useState(0);
  const [processedText, setProcessedText] = useState('');
  const scrollRef = useRef(null);

  // 1. Variable Replacement
  useEffect(() => {
    if (!text) return;
    const replaced = text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = context[variableName.trim()];
      return value !== undefined ? value : match;
    });
    
    if (replaced !== processedText) {
      setProcessedText(replaced);
      setGlobalIndex(0);
    }
  }, [text, context, processedText]);

  // 2. Parse Segments
  const segments = React.useMemo(() => parseTextToSegments(processedText), [processedText]);
  const totalChars = segments.reduce((acc, seg) => acc + seg.text.length, 0);

  // 3. Timer Logic
  useEffect(() => {
    if (!processedText) return;

    if (forceShowFull || isDrivingActive) {
      setGlobalIndex(totalChars);
      if (onComplete) onComplete();
      if (onUpdate) onUpdate();
      return;
    }

    if (globalIndex < totalChars) {
      const timeout = setTimeout(() => {
        setGlobalIndex(prev => prev + 1);
        if (onUpdate) onUpdate();
      }, 30);
      return () => clearTimeout(timeout);
    } else {
      if (onComplete) onComplete();
    }
  }, [globalIndex, totalChars, processedText, forceShowFull, isDrivingActive, onComplete, onUpdate]);

  // 4. Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalIndex]);

  // 5. Render
  let charCounter = 0;
  return (
    <div style={{ whiteSpace: 'pre-wrap', display: 'flex', flexDirection: 'column' }}>
      <div>
        {segments.map((seg, i) => {
          const start = charCounter;
          const end = charCounter + seg.text.length;
          charCounter += seg.text.length;

          if (globalIndex < start) return null;

          const visibleText = globalIndex >= end 
            ? seg.text 
            : seg.text.slice(0, globalIndex - start);

          return (
            <span key={i} style={{ color: seg.color }}>
              {visibleText}
              {seg.newLine && <br/>}
            </span>
          );
        })}
        {globalIndex < totalChars && <span className="animate-pulse">_</span>}
      </div>
      <div ref={scrollRef} />
    </div>
  );
};

function App() {
  const [state, send, actor] = useMachine(parkingGameMachine);
  const [typingComplete, setTypingComplete] = useState(false);
  const [areOptionsVisible, setAreOptionsVisible] = useState(false); // New Cinematic State
  const [showIgnitionUI, setShowIgnitionUI] = useState(false); // Specific state for Ignition Phase B
  const [startPhase, setStartPhase] = useState(0); // 3-Stage State for Ignition
  const [choiceStep, setChoiceStep] = useState('TEXT'); // Split View State for Choice Phase
  const [forceShowFull, setForceShowFull] = useState(false);
  const [email, setEmail] = useState('');
  const [drivingDistance, setDrivingDistance] = useState(500); // Lifted state for driving
  const messagesEndRef = useRef(null);
  const qteContainerRef = useRef(null); // Ref for QTE Auto-scroll

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentState = state.value;
  const context = state.context;

  // State Name Mapping for Localization
  const stateNameMapping = {
    'intro1': '初始載入',
    'intro2': '系統異常',
    'intro3': '強制傳送',
    'introStory1': '異世界 (1/3)',
    'introStory2': '異世界 (2/3)',
    'introStory3': '異世界 (3/3)',
    'tutorialIntro': '新手引導模式',
    'inCar': '車內待命',
    'qteSequence': '引擎啟動',
    'engineStall': '啟動失敗',
    'driving': '駕駛中',
    'atGate': '抵達閘門',
    'gateOpening': '閘門開啟',
    'parked': '停車完成',
    'postDriveChoice': '行動選擇',
    'outcomeCat': '結局：貓',
    'outcomeSpaghetti': '結局：義大利麵',
    'outcomeBoundary': '結局：邊界',
    'mysteriousEvent': '異常事件',
    'transitionToPayment': '前往繳費',
    'outsideCar': '離場結算',
    'paymentInfo': '繳費資訊',
    'paymentSuccess': '繳費成功',
    'endingBlackhole': '結局：黑洞',
    'endingDance': '結局：舞力全開',
    'endingRemix': '結局：Remix'
  };



  // Use Custom Hook for Driving Mechanic
  const { 
    drivingTimeLeft, 
    drivingMaxDuration, 
    drivingStrikes, 
    isDrivingActive, 
    handleDriveInput 
  } = useDrivingMechanic(currentState, send);

  // Reset driving distance when entering driving state
  useEffect(() => {
    if (currentState === 'driving') {
      setDrivingDistance(prev => {
        // Resume if mid-progress (between 0 and 500)
        if (prev > 0 && prev < 500) return prev;
        // Otherwise reset to full distance
        return 500;
      });
    }
  }, [currentState]);

  // Auto-trigger gate when distance reaches 0
  useEffect(() => {
    if (currentState === 'driving' && drivingDistance <= 0) {
      // Small delay for effect
      const timer = setTimeout(() => {
        send({ type: 'DISTANCE_REACHED' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentState, drivingDistance, send]);

  // Reset typing state when text changes
  useEffect(() => {
    // ★★★ 關鍵：如果是開車模式，直接殺死這個 Effect，不准跑 ★★★
    if (currentState === 'driving') return;

    setTypingComplete(false);
    setAreOptionsVisible(false); // Reset options visibility
    setShowIgnitionUI(false); // Reset Ignition UI
    setStartPhase(0); // Reset Ignition Phase
    setChoiceStep('TEXT'); // Reset Choice Step
    setForceShowFull(false);
  }, [context.currentText, currentState]);

  // Auto-scroll to QTE UI when it appears
  useEffect(() => {
    if (startPhase === 2 && qteContainerRef.current) {
      qteContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [startPhase]);

  // Auto-check QTE completion
  useEffect(() => {
    if (currentState === 'qteSequence' && 
        context.qteProgress >= context.qteSequence.length &&
        context.qteSequence.length > 0) {
      send({ type: 'QTE_SUCCESS' });
    }
  }, [currentState, context.qteProgress, context.qteSequence.length, send]);

  // QTE Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentState === 'qteSequence') {
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          send({ type: 'KEY_PRESS', key: e.key });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentState, send]);

  // --- CHOICE_PHASE 狀態初始化 ---
  useEffect(() => {
    if (currentState === 'postDriveChoice') {
      setChoiceStep('INVESTIGATE');
    }
  }, [currentState]);

  // Get available choices
  const getChoices = () => {
    switch (currentState) {
      case 'intro1': 
      case 'introStory1':
      case 'introStory2':
      case 'introStory3':
      case 'tutorialIntro':
        return [{ label: '繼續', action: 'NEXT' }];
      case 'intro2': return [{ label: '發生什麼事了？', action: 'NEXT' }];
      case 'intro3': return [{ label: '四處看看', action: 'NEXT' }];
      case 'intro4': return [{ label: '走向車輛', action: 'NEXT' }];
      case 'inCar': return [{ label: '啟動引擎 (QTE)', action: 'NEXT' }];
      case 'engineStall': return [{ label: '再試一次', action: 'RETRY' }];
      case 'atGate': return []; // Auto-advance, no button needed
      case 'gateOpening': return [{ label: '停車', action: 'PARK' }];
      case 'parked': return [{ label: '[ 斷開連結 // 離開車輛 ]', action: 'EXIT_CAR' }];
      case 'postDriveChoice': 
        if (context.isTimeSkipped) {
          return [{ label: '前往繳費', action: 'GO_PAY' }];
        }
        return [
          { label: '調查奇怪的貓咪', action: 'CHOOSE_CAT' },
          { label: '查看地上的義大利麵', action: 'CHOOSE_SPAGHETTI' },
          { label: '走向出口離開', action: 'CHOOSE_BOUNDARY' }
        ];
      case 'outcomeCat':
        const catChoices = [
          { label: '摸摸貓咪', action: 'PET_CAT' },
          { label: '回到停車場', action: 'BACK' }
        ];
        if (context.hasSpaghetti) {
          catChoices.unshift({ label: '餵貓吃義大利麵', action: 'FEED_CAT' });
        }
        return catChoices;
      case 'outcomeSpaghetti':
        return [
          { label: '吃掉它', action: 'EAT_SPAGHETTI' },
          { label: '拿走它', action: 'TAKE_SPAGHETTI' },
          { label: '回到停車場', action: 'BACK' }
        ];
      case 'outcomeBoundary':
        return [{ label: '回到停車場', action: 'BACK' }];
      case 'mysteriousEvent':
        return [{ label: '前往繳費', action: 'GO_PAY' }];
      case 'transitionToPayment':
        return [{ label: '前往繳費選項', action: 'NEXT' }];
      case 'endingBlackhole':
      case 'endingDance':
      case 'endingRemix':
        return []; // Auto-transition
      case 'outsideCar': return [{ label: '繳費', action: 'PAY' }];
      case 'paymentInfo': return [{ label: '確認付款', action: 'CONFIRM_PAY' }];
      case 'paymentSuccess': return [{ label: '結束遊戲', action: 'RESTART' }];
      default: return [];
    }
  };

  const choices = getChoices();
  const isGenericContinue = choices.length === 1 && choices[0].label === '繼續';

  // Comprehensive Reset Function
  const handleRestart = () => {
    // 1. Reset Local Driving State
    setDrivingDistance(500);
    
    // 2. Reset UI State
    setEmail('');
    setTypingComplete(false);
    setForceShowFull(false);

    // 3. Reset Game Machine State (includes inventory, counters, etc.)
    send({ type: 'RESTART' });
  };

  const handleTerminalClick = () => {
    // Prevent interaction during driving to avoid accidental text skipping
    if (currentState === 'driving') return;

    if (!typingComplete) {
      setForceShowFull(true);
      return;
    }
    
    if (isGenericContinue) {
      send({ type: 'NEXT' });
    }
  };

  return (
    <div className="game-container">
      {/* Left Column: Main Play Area */}
      <div className="play-area">
        {/* Top: Visuals */}
        <div className="scene-viewport">
          <SceneDisplay 
            background={context.backgroundImage}
            character={context.characterImage}
            gameState={currentState}
            onTutorialComplete={() => send({ type: 'NEXT' })}
          />
          <div className="scene-overlay"></div>
        </div>

        {/* Bottom: Dialogue & Controls */}
        <div className="dialogue-terminal" onClick={handleTerminalClick}>
          <div className="terminal-header">
            <span className="terminal-title">// 互動式終端 // {stateNameMapping[currentState] || currentState}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
          </div>

          <div className="dialogue-text" style={{ whiteSpace: 'pre-wrap', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            


            {/* Standard Unified Rendering for ALL Narrative States */}
            {/* VIEW 1: Narrative (Phase 0 & 1 ONLY) */}
            {!(currentState === 'qteSequence' && startPhase === 2) && currentState !== 'postDriveChoice' && (
              <div className="w-full animate-in fade-in duration-500">
                <TypewriterText 
                  text={context.currentText} 
                  context={context}
                  onComplete={() => {
                    setTypingComplete(true);
                    setAreOptionsVisible(true);
                    if (currentState === 'qteSequence' && startPhase === 0) {
                      setStartPhase(1);
                    }
                  }}
                  forceShowFull={forceShowFull}
                  isDrivingActive={isDrivingActive}
                  onUpdate={scrollToBottom}
                />
                
                {/* Phase 1: Loading Text (Only for qteSequence) */}
                {currentState === 'qteSequence' && startPhase === 1 && (
                  <div className="w-full mb-8 animate-pulse" style={{ marginTop: '1rem', color: '#facc15', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <TypewriterText 
                      text={`> [系統]: 正在載入觸發介面 ... 100%`} 
                      context={{}}
                      forceShowFull={false}
                      onUpdate={scrollToBottom}
                      onComplete={() => {
                        // CRITICAL: Wait 1.5s before switching to Phase 2
                        setTimeout(() => setStartPhase(2), 1500);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {currentState === 'driving' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <ManualDrivingConsole 
                  distance={drivingDistance}
                  onDistanceChange={setDrivingDistance}
                  onCrash={() => send({ type: 'GAME_OVER' })} 
                  onFinish={() => { /* Handled by useEffect now */ }}
                />
              </div>
            )}
            
            {/* Next Indicator (Unified) */}
            {isGenericContinue && (
              <div 
                className={`story-controls transition-all duration-1000 ease-out ${
                  areOptionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`} 
                style={{ marginTop: 'auto' }}
              >
                <span className="text-yellow-400 animate-bounce" style={{ color: 'var(--accent-warning)', fontSize: '1.5rem', animation: 'bounce 1s infinite' }}>▼</span>
              </div>
            )}
            
            {/* Auto-scroll Anchor */}
            <div ref={messagesEndRef} />
            
            {/* VIEW 2: QTE Interface (Phase 2 ONLY) */}
            {currentState === 'qteSequence' && startPhase === 2 && (
              <div 
                ref={qteContainerRef}
                className="w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500"
                style={{ 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                {/* THE STRIP PANEL: Wide (7xl) and Short (py-6) */}
                <div style={{ 
                  position: 'relative',
                  width: '100%',
                  maxWidth: '80rem', // max-w-7xl
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', // bg-black/80
                  borderTop: '1px solid rgba(6, 182, 212, 0.5)', // border-y
                  borderBottom: '1px solid rgba(6, 182, 212, 0.5)',
                  borderRadius: '0.5rem', // rounded-lg
                  padding: '1.5rem 3rem', // py-6 px-12
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem', // gap-4
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 0 40px rgba(8, 145, 178, 0.2)' // shadow
                }}>
                  
                  {/* 1. Header Line */}
                  <div style={{ 
                    width: '100%',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(22, 78, 99, 0.3)', // border-cyan-900/30
                    paddingBottom: '0.5rem' // pb-2
                  }}>
                    <span style={{ 
                      color: '#22d3ee', // text-cyan-400
                      fontFamily: 'monospace', 
                      fontSize: '0.75rem', // text-xs
                      letterSpacing: '0.6em', // tracking-[0.6em]
                      opacity: 0.9
                    }}>
                      // IGNITION SEQUENCE //
                    </span>
                  </div>

                  {/* 2. Arrows (Spread out widely) */}
                  <div style={{ 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6rem', // gap-24
                    padding: '0.5rem 0' // py-2
                  }}>
                    {context.qteSequence.map((key, idx) => {
                      const arrow = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[key];
                      
                      // Determine State Styles
                      let style = { 
                        fontSize: '2.25rem', // text-4xl
                        transition: 'all 0.2s ease',
                        fontWeight: 'bold'
                      };

                      if (idx < context.qteProgress) {
                        // Completed
                        style.color = '#22c55e'; // Green-500
                        style.transform = 'scale(1)';
                      } else if (idx === context.qteProgress) {
                        // Active
                        style.color = '#22d3ee'; // Cyan-400
                        style.transform = 'scale(1.25)';
                        style.filter = 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))';
                        style.animation = 'pulse 1s infinite';
                      } else {
                        // Pending
                        style.color = '#374151'; // Gray-700
                        style.transform = 'scale(0.9)';
                      }

                      return <span key={idx} style={style}>{arrow}</span>;
                    })}
                  </div>

                  {/* 3. Footer Warning */}
                  <div style={{ 
                    color: 'rgba(239, 68, 68, 0.8)', // text-red-500/80
                    fontSize: '0.625rem', // text-[10px]
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em', // tracking-widest
                    textTransform: 'uppercase'
                  }}>
                    WARNING: 3 STRIKES = ENGINE STALL
                  </div>

                </div>
              </div>
            )}

            {/* VIEW 3: Choice Phase (New Horizontal Layout) */}
            {currentState === 'postDriveChoice' && (
              <div className="w-full h-full relative">
                {/* --- STAGE 1: INVESTIGATE (Layout: Absolute Pinning) --- */}
                {(choiceStep === 'INVESTIGATE' || !choiceStep) && (
                  <div className="w-full h-full relative animate-in fade-in duration-500">
                    {/* 1. 文字層：絕對定位在上方 (pinned to top) */}
                    <div className="absolute top-0 left-0 w-full p-10 text-left z-10">
                      <TypewriterText 
                        text={`[主角]: 下車了。但這裡感覺... 有點不太對勁。\n[系統]: 車輛已停妥。周圍環境似乎發生了變化。`}
                        context={context}
                        speed={30}
                      />
                    </div>
                    {/* 2. 按鈕層：絕對定位在底部 (pinned to bottom)，無視文字高度 */}
                    <div 
                      className="choice-menu-overlay absolute bottom-0 w-full opacity-100 translate-y-0 pointer-events-auto z-50 flex justify-center pb-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        onClick={() => setChoiceStep('DECIDE')}
                        className="holo-btn"
                      >
                        [ 環顧四周 ]
                      </button>
                    </div>
                  </div>
                )}
                {/* --- STAGE 2: DECIDE (Neon Grid - Preserved) --- */}
                {choiceStep === 'DECIDE' && (
                  <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 gap-8">
                    <div className="text-cyan-400/80 font-mono text-sm tracking-widest mb-4">
                      // 偵測到可互動目標 //
                    </div>
                    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                      {/* Option 1: Cat */}
                      <button 
                        onClick={() => send({ type: 'CHOOSE_CAT' })}
                        className="group relative h-48 flex flex-col items-center justify-center border-2 border-purple-500/50 bg-black/80 rounded-xl hover:bg-purple-900/20 hover:border-purple-400 hover:scale-105 transition-all shadow-lg"
                      >
                        <div className="text-4xl mb-4 group-hover:animate-bounce">🐱</div>
                        <span className="text-purple-300 font-bold text-lg tracking-widest">調查奇怪的貓咪</span>
                      </button>
                      {/* Option 2: Pasta */}
                      <button 
                        onClick={() => send({ type: 'CHOOSE_SPAGHETTI' })}
                        className="group relative h-48 flex flex-col items-center justify-center border-2 border-yellow-500/50 bg-black/80 rounded-xl hover:bg-yellow-900/20 hover:border-yellow-400 hover:scale-105 transition-all shadow-lg"
                      >
                        <div className="text-4xl mb-4 group-hover:rotate-12 transition-transform">🍝</div>
                        <span className="text-yellow-300 font-bold text-lg tracking-widest">查看地上的義大利麵</span>
                      </button>
                      {/* Option 3: Exit */}
                      <button 
                        onClick={() => send({ type: 'CHOOSE_BOUNDARY' })}
                        className="group relative h-48 flex flex-col items-center justify-center border-2 border-red-500/50 bg-black/80 rounded-xl hover:bg-red-900/20 hover:border-red-400 hover:scale-105 transition-all shadow-lg"
                      >
                        <div className="text-4xl mb-4 group-hover:translate-x-2 transition-transform">🚪</div>
                        <span className="text-red-300 font-bold text-lg tracking-widest">走向出口離開</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Centralized Choice Menu Overlay */}
          {(!isGenericContinue && (choices.length > 0 || currentState === 'inputEmail') && currentState !== 'driving' && currentState !== 'postDriveChoice') && (
            <div 
              className={`choice-menu-overlay transition-all duration-1000 ease-out ${
                areOptionsVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
              }`} 
              onClick={(e) => e.stopPropagation()}
            >
              {currentState === 'inputEmail' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '80%', maxWidth: '500px' }}>
                  <div style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
                    // ENTER CREDENTIALS:
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@corp.net"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '2px solid var(--accent-primary)',
                      color: 'var(--text-main)',
                      padding: '15px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.2rem',
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    className="holo-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      send({ type: 'SUBMIT_EMAIL', email });
                    }}
                    disabled={!email}
                    style={{ width: '100%' }}
                  >
                    CONFIRM UPLOAD
                  </button>
                </div>
              ) : (
                choices.map((choice, idx) => (
                  <button
                    key={idx}
                    className="holo-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (choice.action === 'RESTART') {
                        handleRestart();
                      } else {
                        send({ type: choice.action });
                      }
                    }}
                    disabled={!typingComplete && currentState !== 'engineStall'}
                  >
                    {choice.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Dashboard */}
      <CyberpunkDashboard 
        currentState={currentState}
        distance={currentState === 'driving' ? drivingDistance : (currentState === 'atGate' ? 0 : context.distance)}
        logs={context.logs}
      />

      {/* Virtual Mobile Overlay */}
      <VirtualMobile notification={context.notification} parkedHours={context.parkedHours} />
    </div>
  );
}

export default App;
