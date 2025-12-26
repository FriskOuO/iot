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

// Helper for typing effect with variable replacement
const TypewriterText = ({ text, context, onComplete, forceShowFull, isDrivingActive, onUpdate }) => {
  const [displayed, setDisplayed] = useState('');
  const [processedText, setProcessedText] = useState('');
  
  // First, replace variables in the text
  useEffect(() => {
    if (!text) return;
    
    // Replace {{variable}} with actual values from context
    const replaced = text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = context[variableName.trim()];
      return value !== undefined ? value : match;
    });
    
    setProcessedText(replaced);
  }, [text, context]);

  // Then handle the typewriter effect
  useEffect(() => {
    if (!processedText) return;
    
    // If forceShowFull is enabled OR driving is active, skip animation
    // This prevents the text from re-typing constantly during driving updates
    if (forceShowFull || isDrivingActive) {
      setDisplayed(processedText);
      if (onComplete) onComplete();
      if (onUpdate) onUpdate();
      return;
    }

    setDisplayed('');
    let index = 0;
    
    const timer = setInterval(() => {
      // Increment index first, then slice
      if (index < processedText.length) {
        index++;
        setDisplayed(processedText.slice(0, index));
        if (onUpdate) onUpdate();
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 30);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedText, forceShowFull, isDrivingActive]);

  return <>{displayed}</>;
};

function App() {
  const [state, send, actor] = useMachine(parkingGameMachine);
  const [typingComplete, setTypingComplete] = useState(false);
  const [forceShowFull, setForceShowFull] = useState(false);
  const [email, setEmail] = useState('');
  const [drivingDistance, setDrivingDistance] = useState(500); // Lifted state for driving
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentState = state.value;
  const context = state.context;

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
      setDrivingDistance(500);
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
    setForceShowFull(false);
  }, [context.currentText, currentState]);

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
      case 'parked': return [{ label: '下車', action: 'EXIT_CAR' }];
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
            <span className="terminal-title">Interactive Terminal // {currentState}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
            </div>
          </div>

          <div className="dialogue-text" style={{ whiteSpace: 'pre-wrap', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            {/* Standard Unified Rendering for ALL Narrative States */}
            {context.currentText.split('\n\n').map((line, idx) => {
              // Check if line starts with a speaker tag like [SYSTEM]: or [PROTAGONIST]:
              const match = line.match(/^(\[[^\]]+\]):\s*(.*)/);
              if (match) {
                const speaker = match[1];
                const content = match[2];
                return (
                  <div key={idx}>
                    <span className="character-name">{speaker}:</span>
                    {currentState === 'driving' ? (
                      <span>{content}</span>
                    ) : (
                      <TypewriterText 
                        text={content} 
                        context={context}
                        onComplete={() => setTypingComplete(true)}
                        forceShowFull={forceShowFull}
                        isDrivingActive={isDrivingActive}
                        onUpdate={scrollToBottom}
                      />
                    )}
                  </div>
                );
              }
              // Fallback for lines without speaker tags or special cases
              return (
                <div key={idx}>
                    {currentState === 'driving' ? (
                      <span>{line}</span>
                    ) : (
                      <TypewriterText 
                        text={line} 
                        context={context}
                        onComplete={() => setTypingComplete(true)}
                        forceShowFull={forceShowFull}
                        isDrivingActive={isDrivingActive}
                        onUpdate={scrollToBottom}
                      />
                    )}
                </div>
              );
            })}
            
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
            {isGenericContinue && typingComplete && (
              <div className="story-controls" style={{ marginTop: 'auto' }}>
                <span className="text-yellow-400 animate-bounce" style={{ color: 'var(--accent-warning)', fontSize: '1.5rem', animation: 'bounce 1s infinite' }}>▼</span>
              </div>
            )}
            
            {/* Auto-scroll Anchor */}
            <div ref={messagesEndRef} />
            
            {/* QTE Display */}
            {currentState === 'qteSequence' && (
              <div style={{ marginTop: '20px', padding: '10px', border: '1px solid var(--accent-warning)', color: 'var(--accent-warning)' }}>
                <div>QTE SEQUENCE INITIATED:</div>
                <div style={{ fontSize: '2rem', letterSpacing: '10px', marginTop: '10px' }}>
                  {context.qteSequence.map((key, idx) => {
                    const arrow = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[key];
                    const color = idx < context.qteProgress ? 'var(--accent-success)' : (idx === context.qteProgress ? 'var(--accent-warning)' : '#555');
                    return <span key={idx} style={{ color }}>{arrow}</span>;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Centralized Choice Menu Overlay */}
          {(!isGenericContinue && (choices.length > 0 || currentState === 'inputEmail') && currentState !== 'driving') && (
            <div className="choice-menu-overlay" onClick={(e) => e.stopPropagation()}>
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
