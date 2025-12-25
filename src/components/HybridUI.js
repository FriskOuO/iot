import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from '@xstate/react';
import '../components/VisualNovel.css';
import { getArrowSymbol } from '../gameMachine';

// Images are loaded from public/assets/
const carImg = "/assets/car.png";
const movingCarImg = "/assets/moving_car.png";
const oiiaCatImg = "/assets/oiia_cat.png";
const spaghettiImg = "/assets/spaghetti.png";
const handTouchingImg = "/assets/hand_touching.png";
const mysteriousImg = "/assets/mysterious_person.jpg";
const oiiaCatGif = "/assets/oiia-cat.gif";
const oiiaSoundFile = "/assets/OIIAOIIA_CAT_SOUND.mp3";
const spaghettiVideo = "/assets/SPAGHETTI_DANCE.mp4";
const spaghettiOiiaSound = "/assets/SPAGETTI_OIIA.mp3";
const railingClosedImg = "/assets/railing.png";
const railingOpenImg = "/assets/railing_opening.png";

/**
 * Live Variable Renderer
 * Parses {{variable}} syntax and replaces with real-time context values
 */
const LiveTextRenderer = ({ text, actor }) => {
  const context = useSelector(actor, (state) => state.context);

  if (!text) return null;

  const parts = text.split(/(\{\{[^}]+\}\})/g);

  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(/^\{\{([^}]+)\}\}$/);
        
        if (match) {
          const variableName = match[1].trim();
          const value = context[variableName];
          
          return (
            <span key={index} className="text-yellow-400 font-bold animate-pulse">
              {value !== undefined ? value : `{{${variableName}}}`}
            </span>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

/**
 * Retro RPG Dialogue Box with Live Variables (Portrait Style)
 */
export const RetroDialogueBox = ({ text, characterName, actor, onComplete, characterImage, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [fullText, setFullText] = useState('');

  // QTE State
  const qteSequence = useSelector(actor, (state) => state.context.qteSequence);
  const qteProgress = useSelector(actor, (state) => state.context.qteProgress);
  const currentState = useSelector(actor, (state) => state.value);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setFullText(text);
    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  // QTE Logic
  const handleQTEKeyDown = useCallback((event) => {
    if (currentState !== 'qteSequence' || !qteSequence || qteSequence.length === 0) return;

    const key = event.key;
    if (key.startsWith('Arrow')) {
      event.preventDefault();
      
      const isCorrect = key === qteSequence[qteProgress];
      
      if (!isCorrect) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      
      actor.send({ type: 'KEY_PRESS', key });
    }
  }, [currentState, qteSequence, qteProgress, actor]);

  useEffect(() => {
    if (currentState === 'qteSequence') {
      window.addEventListener('keydown', handleQTEKeyDown);
      return () => window.removeEventListener('keydown', handleQTEKeyDown);
    }
  }, [currentState, handleQTEKeyDown]);

  // Character emoji mapping
  const characterEmoji = {
    'narrator': '📢',
    'driver': '👤',
    'system': '💻'
  };

  return (
    <div className="dialogue-box">
      <div className="dialogue-corner dialogue-corner-tl"></div>
      <div className="dialogue-corner dialogue-corner-tr"></div>
      <div className="dialogue-corner dialogue-corner-bl"></div>
      <div className="dialogue-corner dialogue-corner-br"></div>
      
      {/* Left: Character Portrait */}
      <div className="character-portrait-area">
        <div className="character-portrait-placeholder" style={{ opacity: characterImage === 'protagonist' ? 1 : 0.3 }}>
          {characterImage === 'protagonist' ? (
            <img 
              src="/assets/protagonist.png" 
              alt="Protagonist" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} 
            />
          ) : (
            characterEmoji[characterImage] || '👤'
          )}
        </div>
      </div>
      
      {/* Right: Dialogue Content */}
      <div className="dialogue-content-area">
        <div className="character-badge">{characterName}</div>
        
        <div className="dialogue-text">
          <LiveTextRenderer text={displayedText} actor={actor} />
          {isTyping && <span className="typing-cursor">▮</span>}

          {/* QTE Display */}
          {currentState === 'qteSequence' && qteSequence && qteSequence.length > 0 && (
            <div className={`qte-inline-display ${shake ? 'animate-shake' : ''}`} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <span style={{ fontSize: '0.8em', color: '#aaa', marginRight: '10px' }}>順序：</span>
               {qteSequence.map((key, index) => {
                  let style = { 
                    border: '2px solid #555', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: '#222',
                    color: '#888',
                    fontSize: '1.2em',
                    fontWeight: 'bold'
                  };
                  
                  if (index < qteProgress) {
                    style = { ...style, borderColor: '#4ade80', color: '#4ade80', background: '#14532d' }; // Green
                  } else if (index === qteProgress) {
                    style = { ...style, borderColor: '#facc15', color: '#facc15', background: '#713f12', transform: 'scale(1.1)' }; // Yellow
                  }
                  
                  return (
                    <div key={index} style={style}>
                      {getArrowSymbol(key)}
                    </div>
                  );
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Scene Display Component
 */
export const SceneDisplay = ({ background, character, gameState }) => {
  const backgroundClass = `scene-display scene-${background}`;
  const spaghettiVideoRef = useRef(null);
  const [chaosElements, setChaosElements] = useState([]);

  // Generate Chaos Elements for Remix Ending
  useEffect(() => {
    if (gameState === 'endingRemix') {
      const elements = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        src: Math.random() > 0.3 ? oiiaCatGif : spaghettiImg, // 70% GIF
        top: Math.random() * 100,
        left: Math.random() * 100,
        scale: 0.2 + Math.random() * 2.8, // 0.2 - 3.0
        duration: 0.5 + Math.random() * 0.5, // 0.5s - 1.0s
        delay: Math.random() * 2,
        direction: Math.random() > 0.5 ? 'normal' : 'reverse',
        zIndex: Math.floor(Math.random() * 10)
      }));
      setChaosElements(elements);
    } else {
      setChaosElements([]);
    }
  }, [gameState]);

  // Audio Effect for Black Hole Ending
  useEffect(() => {
    if (gameState === 'endingBlackhole') {
      const audio = new Audio(oiiaSoundFile);
      audio.volume = 1.0;
      audio.loop = true; 
      audio.play().catch(e => console.error("Audio play failed", e));

      const fadeDuration = 7000; // 7 seconds
      const fadeSteps = 50; // Update every 50ms
      const volumeStep = 1.0 / (fadeDuration / fadeSteps);

      const fadeInterval = setInterval(() => {
        if (audio.volume > volumeStep) {
          audio.volume = Math.max(0, audio.volume - volumeStep);
        } else {
          audio.volume = 0;
          clearInterval(fadeInterval);
          audio.pause();
        }
      }, fadeSteps);

      return () => {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [gameState]);

  // Video Volume Control for Spaghetti Dance
  useEffect(() => {
    if (gameState === 'endingDance' && spaghettiVideoRef.current) {
      spaghettiVideoRef.current.volume = 0.5;
      spaghettiVideoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [gameState]);

  // Audio Effect for Remix Ending
  useEffect(() => {
    if (gameState === 'endingRemix') {
      const audio = new Audio(spaghettiOiiaSound);
      audio.volume = 0.5; // Set to 50%
      audio.play().catch(e => console.error("Audio play failed", e));

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [gameState]);

  // Determine which image to show based on game state
  const getSceneImage = () => {
    switch (gameState) {
      case 'driving':
        return movingCarImg;
      case 'atGate':
        return railingClosedImg;
      case 'gateOpening':
        return railingOpenImg;
      case 'endingBlackhole':
        return oiiaCatGif;
      case 'outcomeCat':
        return oiiaCatImg;
      case 'endingRemix':
        return oiiaCatGif; // Use GIF for Remix
      case 'outcomeSpaghetti':
      case 'endingDance':
        return spaghettiImg;
      case 'outcomeBoundary':
        return handTouchingImg;
      case 'mysteriousEvent':
        return mysteriousImg;
      case 'intro4':
      case 'inCar':
      case 'engineStall':
      case 'parked':
      case 'postDriveChoice':
        return carImg;
      case 'intro1':
      case 'intro2':
      case 'intro3':
      default:
        return "/assets/protagonist.png"; // Default mask/protagonist
    }
  };

  // Determine CSS classes for animation
  const getAnimationClass = () => {
    if (gameState === 'driving') return "driving-rumble";
    if (gameState === 'endingBlackhole') return "spin-implode";
    if (gameState === 'endingDance') return "dance-shake";
    if (gameState === 'endingRemix') return "spin-implode"; // Main center image spins too
    return "scene-floating-effect";
  };

  return (
    <div className={backgroundClass} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Chaos Background Layer */}
      {gameState === 'endingRemix' && chaosElements.map(el => (
        <img
          key={el.id}
          src={el.src}
          alt="chaos"
          className="super-chaos-spin"
          style={{
            position: 'absolute',
            top: `${el.top}%`,
            left: `${el.left}%`,
            width: `${100 * el.scale}px`,
            height: `${100 * el.scale}px`,
            objectFit: 'contain',
            animationDuration: `${el.duration}s`,
            animationDelay: `-${el.delay}s`,
            animationDirection: el.direction,
            opacity: 0.8,
            zIndex: el.zIndex
          }}
        />
      ))}

      <div className="character-sprite" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 20 }}>
        {gameState === 'endingDance' ? (
          <video 
            ref={spaghettiVideoRef}
            src={spaghettiVideo} 
            autoPlay 
            className="w-full h-full object-cover"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              maxWidth: '800px'
            }}
          />
        ) : (
          <img 
            src={getSceneImage()} 
            alt="Main Scene"
            className={getAnimationClass()}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '800px' // Prevent it from getting absurdly wide on large screens
            }}
          />
        )}
      </div>
      
      <div className="scanline-overlay" style={{ zIndex: 10 }}></div>
    </div>
  );
};

/**
 * Choice Buttons Component (Hybrid: Mouse + Keyboard)
 */
export const ChoiceButtons = ({ choices, onChoice, disabled = false, onKeyPress }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key;
      const numKey = parseInt(key);
      
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        const index = numKey - 1;
        if (choices[index] && !choices[index].disabled) {
          event.preventDefault();
          onChoice(choices[index].action);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [choices, onChoice]);

  return (
    <div className="choice-container">
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => !choice.disabled && onChoice(choice.action)}
          disabled={choice.disabled}
          className="choice-button"
        >
          <span className="choice-hotkey">[{index + 1}]</span>
          <span>{choice.label}</span>
          <span className="choice-arrow">→</span>
        </button>
      ))}
    </div>
  );
};

export default LiveTextRenderer;
