import React, { useState, useEffect } from 'react';
import { getArrowSymbol } from '../visualNovelMachine';
import './VisualNovel.css';

/**
 * Visual Novel Dialogue Box Component
 * RPG-style text box with typewriter effect
 */
const DialogueBox = ({ 
  text, 
  characterName = 'System',
  onComplete,
  speed = 30,
  portrait
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
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

  return (
    <div className="dialogue-box">
      <div className="dialogue-corner dialogue-corner-tl"></div>
      <div className="dialogue-corner dialogue-corner-tr"></div>
      <div className="dialogue-corner dialogue-corner-bl"></div>
      <div className="dialogue-corner dialogue-corner-br"></div>
      
      {/* Left: Portrait Area */}
      <div className="character-portrait-area">
         {portrait ? (
             typeof portrait === 'string' && portrait.length > 2 ? 
             <img src={portrait} className="character-portrait" alt={characterName} /> :
             <div className="character-portrait-placeholder">{portrait}</div>
         ) : (
             <div className="character-portrait-placeholder">👤</div>
         )}
      </div>

      {/* Right: Content Area */}
      <div className="dialogue-content-area">
        <div className="character-badge">
          {characterName}
        </div>

        <div className="dialogue-text">
          {displayedText}
          {isTyping && <span className="typing-cursor">▮</span>}
        </div>
      </div>
    </div>
  );
};

/**
 * Scene Display Component
 * Shows background and character portrait
 */
const SceneDisplay = ({ background, character }) => {
  const backgroundClass = `scene-display scene-${background}`;

  // Handle public assets explicitly
  const style = {};
  if (background === 'teach') {
    style.backgroundImage = `url(${process.env.PUBLIC_URL}/assets/teach.png)`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
    style.backgroundRepeat = 'no-repeat';
  }

  const characterImages = {
    'narrator': '🎭',
    'driver': '🚗',
    'system': '🤖'
  };

  return (
    <div className={backgroundClass} style={style}>
      <div className="character-sprite">
        {characterImages[character] || characterImages['narrator']}
      </div>
      
      <div className="scanline-overlay"></div>
    </div>
  );
};

/**
 * Choice Buttons Component
 */
const ChoiceButtons = ({ choices, onChoice, disabled = false }) => {
  return (
    <div className="choice-container">
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onChoice(choice.action)}
          disabled={disabled}
          className="choice-button"
        >
          <span>▶ {choice.label}</span>
          <span className="choice-arrow">→</span>
        </button>
      ))}
    </div>
  );
};

/**
 * QTE Overlay Component
 * Shows arrow key sequence for Quick Time Event
 */
const QTEOverlay = ({ 
  sequence = [], 
  currentProgress = 0, 
  isActive = false 
}) => {
  if (!isActive) return null;

  const getKeyClass = (index) => {
    if (index < currentProgress) return 'qte-key qte-key-complete';
    if (index === currentProgress) return 'qte-key qte-key-active';
    return 'qte-key qte-key-pending';
  };

  return (
    <div className="qte-overlay">
      <div className="qte-container">
        <h2 className="qte-title">
          ⚡ 引擎啟動挑戰 ⚡
        </h2>
        
        <div className="qte-sequence">
          {sequence.map((key, index) => (
            <div key={index} className={getKeyClass(index)}>
              {getArrowSymbol(key)}
            </div>
          ))}
        </div>

        <div className="qte-progress">
          進度: {currentProgress} / {sequence.length}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Visual Novel Component
 */
const VisualNovelUI = ({ 
  currentState,
  context, 
  onChoice
}) => {
  const [typingComplete, setTypingComplete] = useState(false);

  // Define choices based on current state
  const getChoices = () => {
    switch (currentState) {
      case 'start':
        return [{ label: '進入車內', action: 'NEXT' }];
      case 'inCar':
        return [{ label: '啟動引擎', action: 'NEXT' }];
      case 'engineStall':
        return [{ label: '再試一次', action: 'RETRY' }];
      case 'atGate':
        return [{ label: '開啟閘門', action: 'OPEN_GATE' }];
      case 'gateOpening':
        return [{ label: '停車', action: 'PARK' }];
      case 'parked':
        return [{ label: '重新開始', action: 'RESTART' }];
      default:
        return [];
    }
  };

  const choices = getChoices();
  const showQTE = currentState === 'qteSequence';

  return (
    <div className="visual-novel-container">
      <SceneDisplay 
        background={context.backgroundImage}
        character={context.characterImage}
      />

      <DialogueBox
        text={context.currentText}
        characterName={context.characterImage === 'narrator' ? '旁白' : context.characterImage === 'driver' ? '駕駛' : '系統'}
        onComplete={() => setTypingComplete(true)}
      />

      {!showQTE && choices.length > 0 && (
        <ChoiceButtons
          choices={choices}
          onChoice={onChoice}
          disabled={!typingComplete && currentState !== 'engineStall'}
        />
      )}

      <QTEOverlay
        sequence={context.qteSequence}
        currentProgress={context.qteProgress}
        isActive={showQTE}
      />
    </div>
  );
};

export default VisualNovelUI;
export { DialogueBox, SceneDisplay, ChoiceButtons, QTEOverlay };
