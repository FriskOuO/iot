import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import './components/CyberpunkUI.css'; // New Cyberpunk Styles
import './components/StoryMode.css'; // Story Mode Styles
import { visualNovelMachine } from './visualNovelMachine';
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

// Neon Button Base (Black bg, glow effect)
const NEON_BTN_BASE = "group relative h-48 flex flex-col items-center justify-center border-2 bg-black/80 backdrop-blur-md rounded-xl transition-all duration-300 shadow-lg hover:scale-[1.02]";

// Red Alert Button (Transparent bg, Red border, Bottom centered) - MATCHES REFERENCE IMAGE
const RED_ALERT_BTN = "px-24 py-5 border border-red-500 text-red-500 text-xl font-bold tracking-[0.2em] bg-transparent hover:bg-red-900/20 hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-all duration-500 rounded-sm cursor-pointer z-50";

// Helper for inline styles
const choiceBtnStyle = (color) => ({
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: `2px solid ${color}80`, // 50% opacity
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 0 10px ${color}33`, // 20% opacity
    backdropFilter: 'blur(4px)'
});

// Helper for generic button styles (Subsequent choices)
const genericBtnStyle = (color) => ({
    flex: 1,
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: `1px solid ${color}80`,
    color: color,
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 0 10px ${color}20`,
    textAlign: 'center',
    textTransform: 'uppercase',
    position: 'relative',
    overflow: 'hidden'
});

function App() {
  const [state, send, actor] = useMachine(visualNovelMachine);
  const [typingComplete, setTypingComplete] = useState(false);
  const [areOptionsVisible, setAreOptionsVisible] = useState(false); // New Cinematic State
  const [showIgnitionUI, setShowIgnitionUI] = useState(false); // Specific state for Ignition Phase B
  const [startPhase, setStartPhase] = useState(0); // 3-Stage State for Ignition
  const [choiceStep, setChoiceStep] = useState('TEXT'); // Split View State for Choice Phase
  const [forceShowFull, setForceShowFull] = useState(false);
  const [prevText, setPrevText] = useState(''); // Track previous text for immediate reset
  const [email, setEmail] = useState('');
  const [drivingDistance, setDrivingDistance] = useState(500); // Lifted state for driving
  const messagesEndRef = useRef(null);
  const qteContainerRef = useRef(null); // Ref for QTE Auto-scroll

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentState = state.value;
  const context = state.context;

  // IMMEDIATE STATE RESET PATTERN
  // Detects text change during render to prevent "flash of completed text"
  if (context.currentText !== prevText) {
    setPrevText(context.currentText);
    setForceShowFull(false);
    setTypingComplete(false);
    setAreOptionsVisible(false);
  }

  // State Name Mapping for Localization
  const stateNameMapping = {
    'start': '異世界轉生',
    'inCar': '車內待命',
    'qteSequence': '引擎啟動',
    'engineStall': '啟動失敗',
    'driving': '駕駛中',
    'atGate': '抵達閘門',
    'gateOpening': '閘門開啟',
    'parked': '停車場中心',
    'interactCat': '迷因貓',
    'interactSpaghetti': '義大利麵',
    'interactExit': '地圖邊界',
    'endingBlackHole': '結局：黑洞',
    'endingCatChaos': '結局：迷因大亂鬥',
    'endingSpaghettiDance': '結局：舞力全開',
    'endingAdmin': '結局：管理員',
    'endingBSOD': '結局：藍屏',
    'paymentNarrative': '繳費中心',
    'paymentInput': '輸入資料',
    'finished': '遊戲結束'
  };



  // Use Custom Hook for Driving Mechanic
  // const { 
  //   drivingTimeLeft, 
  //   drivingMaxDuration, 
  //   drivingStrikes, 
  //   isDrivingActive, 
  //   handleDriveInput 
  // } = useDrivingMechanic(currentState, send);
  const isDrivingActive = currentState === 'driving'; // Simplified for UI logic

  // Sync manual driving distance to machine context
  useEffect(() => {
    if (currentState === 'driving') {
      send({ type: 'UPDATE_DISTANCE', distance: drivingDistance });
    }
  }, [drivingDistance, currentState, send]);

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

  // (Removed useEffect for text reset as it is now handled by immediate state derivation above)

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

  // Force Reset for Choice Phase (Absolute Positioning Fix)
  useEffect(() => {
    if (currentState === 'postDriveChoice') {
        setChoiceStep('INVESTIGATE');
    }
  }, [currentState]);

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
      setChoiceStep('DECIDE');
    }
  }, [currentState]);

  // Get available choices
  const getChoices = () => {
    switch (currentState) {
      case 'start': return [{ label: '強行進入(物理)', action: 'NEXT' }];
      case 'inCar': 
        const inCarChoices = [{ label: '啟動引擎', action: 'NEXT' }];
        if (context.gameCleared) {
            inCarChoices.push({ label: '🤖 自動駕駛 (VIP)', action: 'AUTO_PILOT' });
        }
        inCarChoices.push({ label: '原地發呆', action: 'DO_NOTHING' });
        return inCarChoices;
      case 'qteSequence': return []; // Handled by keyboard
      case 'engineStall': return [{ label: '再試一次', action: 'RETRY' }];
      case 'driving': return []; // Handled by simulation
      case 'atGate': return []; // Auto-trigger
      case 'gateOpening': return []; // Auto-trigger
      
      case 'parked': return [
        { label: '🐱 查看貓咪', action: 'GO_CAT' },
        { label: '🍝 查看義大利麵', action: 'GO_SPAGHETTI' },
        { label: '🧱 走向邊界', action: 'GO_EXIT' }
      ];

      case 'interactCat': 
        const catChoices = [{ label: '✋ 摸摸貓咪', action: 'TOUCH_CAT' }];
        if (context.hasSpaghetti) {
            catChoices.push({ label: '🍝 餵食義大利麵', action: 'FEED_CAT' });
        }
        catChoices.push({ label: '🔙 回到停車場', action: 'BACK' });
        return catChoices;

      case 'interactSpaghetti':
        const spagChoices = [];
        if (!context.hasSpaghetti) {
            spagChoices.push({ label: '🍴 吃掉它', action: 'EAT_SPAGHETTI' });
            spagChoices.push({ label: '🎒 拿起義大利麵', action: 'PICK_UP' });
        }
        spagChoices.push({ label: '🔙 回到停車場', action: 'BACK' });
        return spagChoices;

      case 'interactExit': return [
        { label: '💥 撞擊牆壁', action: 'HIT_WALL' },
        { label: '🔙 回到停車場', action: 'BACK' }
      ];

      case 'endingBlackHole':
      case 'endingCatChaos':
      case 'endingSpaghettiDance':
      case 'endingAdmin':
        return [{ label: '前往繳費', action: 'NEXT' }];

      case 'endingBSOD':
      case 'finished':
        return [{ label: '再來一把', action: 'RESTART' }];
        
      case 'paymentNarrative': return []; // Handled by Proceed Button
      case 'paymentInput': return []; // Handled by Email Input UI

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
            onVideoComplete={() => send({ type: 'VIDEO_COMPLETE' })}
            context={context}
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

          <div className="dialogue-text" style={{ 
            whiteSpace: 'pre-wrap', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px', 
            flex: 1,
            minHeight: 0,
            overflowY: 'auto', 
            paddingRight: '10px'
          }}>
            


            {/* Standard Unified Rendering for ALL Narrative States */}
            {/* VIEW 1: Narrative (Phase 0 & 1 ONLY) */}
            {!(currentState === 'qteSequence' && startPhase === 2) && currentState !== 'paymentInput' && (
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
            
            {/* VIEW 3: Choice Phase (Inside Terminal) - REMOVED */}
            
            {currentState === 'driving' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {state.context.isAutoPilot ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: '#22d3ee',
                    fontFamily: 'monospace',
                    gap: '1rem'
                  }}>
                    <div className="animate-pulse" style={{ fontSize: '3rem' }}>🤖</div>
                    <div style={{ fontSize: '1.5rem', letterSpacing: '0.2em' }}>AUTO PILOT ENGAGED</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>SIT BACK AND RELAX</div>
                  </div>
                ) : (
                  <ManualDrivingConsole 
                    distance={drivingDistance}
                    onDistanceChange={setDrivingDistance}
                    onCrash={() => send({ type: 'GAME_OVER' })} 
                    onFinish={() => { /* Handled by useEffect now */ }}
                  />
                )}
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

      {/* ------------------------------------------------------------------------------------ */}
          {/* Centralized Choice Menu Overlay (Moved Inside) */}
          {(!isGenericContinue && (choices.length > 0 || currentState === 'paymentInput' || currentState === 'paymentNarrative') && currentState !== 'driving') && (
            <div 
              className={`transition-all duration-1000 ease-out ${
                areOptionsVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
              }`} 
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '15px',
                padding: '10px 20px',
                zIndex: 50,
                flexShrink: 0,
                marginTop: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {currentState === 'paymentInput' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '90%', maxWidth: '600px' }}>
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
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button
                      className="holo-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        send({ type: 'BACK' });
                      }}
                      style={{ flex: 1, opacity: 0.8 }}
                    >
                      [ 返回 ]
                    </button>
                    <button
                      className="holo-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        send({ type: 'SUBMIT_EMAIL', email });
                      }}
                      disabled={!email}
                      style={{ flex: 2 }}
                    >
                      [ 確認傳送 ]
                    </button>
                  </div>
                </div>
              ) : currentState === 'paymentNarrative' ? (
                <button
                  className="holo-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    send({ type: 'PROCEED_TO_PAY' });
                  }}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  [ 💳 前往繳費 ]
                </button>
              ) : (
                choices.map((choice, idx) => {
                  // Determine theme color based on current state or choice label
                  let themeColor = '#06b6d4'; // Default Cyan
                  if (currentState.includes('Cat') || choice.label.includes('貓')) themeColor = '#a855f7'; // Purple
                  else if (currentState.includes('Spaghetti') || currentState.includes('Pasta') || choice.label.includes('麵')) themeColor = '#eab308'; // Yellow
                  else if (currentState.includes('Boundary') || currentState.includes('Exit') || choice.label.includes('離開')) themeColor = '#ef4444'; // Red
                  
                  return (
                    <button
                      key={idx}
                      style={genericBtnStyle(themeColor)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (choice.action === 'RESTART') {
                          handleRestart();
                        } else {
                          send({ type: choice.action });
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = themeColor;
                        e.currentTarget.style.boxShadow = `0 0 20px ${themeColor}66`; // 40% opacity
                        e.currentTarget.style.backgroundColor = `${themeColor}1a`; // 10% opacity
                        e.currentTarget.style.letterSpacing = '0.2em';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = `${themeColor}80`;
                        e.currentTarget.style.boxShadow = `0 0 10px ${themeColor}20`;
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                        e.currentTarget.style.letterSpacing = '0.1em';
                      }}
                      disabled={!typingComplete && currentState !== 'engineStall'}
                    >
                      {choice.label}
                    </button>
                  );
                })
              )}
            </div>
          )}
      {/* VIEW 3: Choice Phase (REMOVED - Now handled inside dialogue-terminal) */}
          </div>
        </div>
      </div>

      {/* Right Column: Dashboard */}
      <CyberpunkDashboard 
        currentState={currentState}
        distance={currentState === 'driving' ? drivingDistance : context.distance}
        logs={context.logs}
      />

      {/* Virtual Mobile Overlay */}
      <VirtualMobile notification={context.notification} parkedHours={context.parkedHours} />
    </div>
  );
}

export default App;
