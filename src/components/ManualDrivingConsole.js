import React, { useState, useEffect, useCallback, useRef } from 'react';

const KEYS = ['W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const KEY_DISPLAY = {
  'W': 'W', 'A': 'A', 'S': 'S', 'D': 'D',
  'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→'
};

const ManualDrivingConsole = ({ distance, onDistanceChange, onCrash, onFinish }) => {
  const [durability, setDurability] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [currentKey, setCurrentKey] = useState(null);
  const [feedback, setFeedback] = useState('WAITING FOR SIGNAL...');
  const [feedbackColor, setFeedbackColor] = useState('var(--accent-primary)');
  const [timeLeft, setTimeLeft] = useState(100);
  const [isActive, setIsActive] = useState(false);

  const MOVE_DISTANCE = 25;

  // Initialize
  useEffect(() => {
    generateNewKey();
    setIsActive(true);
    setFeedback('PRESS KEY');
    setFeedbackColor('var(--text-main)');
  }, []);

  // Timer Logic (Strict Loop)
  useEffect(() => {
    if (!isActive) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 2.5); // 50ms tick, 2000ms total -> 2.5% per tick
      }, 50);
      return () => clearTimeout(timerId);
    } else {
      handleTimeout();
    }
  }, [timeLeft, isActive]);

  const generateNewKey = () => {
    const nextKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    setCurrentKey(nextKey);
    setTimeLeft(100);
  };

  const handleTimeout = () => {
    // 1. Penalty
    setDurability(prev => {
      const newVal = Math.max(0, prev - 20);
      if (newVal <= 0) {
        if (onCrash) onCrash();
      }
      return newVal;
    });

    // 2. Mistakes & Logic (Consecutive 3 mistakes OR Durability 0)
    setMistakes(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        setFeedback("SYSTEM FAILURE: TOO MANY ERRORS");
        setFeedbackColor('var(--accent-warning)');
        setIsActive(false);
        setTimeout(() => {
          if (onCrash) onCrash();
        }, 1000);
      } else {
        setFeedback("TIMEOUT! ENGINE STALL");
        setFeedbackColor('var(--accent-warning)');
        generateNewKey(); // Immediate reset
      }
      return newCount;
    });
  };

  const handleInput = useCallback((e) => {
    if (!isActive || !currentKey) return;

    const inputKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (['Shift', 'Control', 'Alt'].includes(inputKey)) return;

    if (inputKey === currentKey) {
      // Success
      setMistakes(0); // Reset consecutive mistakes
      const newDist = Math.max(0, distance - MOVE_DISTANCE);
      onDistanceChange(newDist);
      setFeedback('PERFECT SHIFT');
      setFeedbackColor('var(--accent-success)');
      
      if (newDist <= 0) {
        // Ensure we hit exactly 0 or less to trigger finish
        onDistanceChange(0); 
        onFinish();
        setIsActive(false);
      } else {
        generateNewKey(); // Immediate next key
      }
    } else {
      // Wrong Key
      setDurability(prev => {
        const newVal = Math.max(0, prev - 10);
        if (newVal <= 0) {
           if (onCrash) onCrash();
           setIsActive(false);
        }
        return newVal;
      });
      
      setMistakes(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setFeedback("SYSTEM FAILURE: TOO MANY ERRORS");
          setFeedbackColor('var(--accent-warning)');
          setIsActive(false);
          setTimeout(() => {
            if (onCrash) onCrash();
          }, 1000);
        } else {
          setFeedback(`WRONG INPUT! (${inputKey})`);
          setFeedbackColor('var(--accent-warning)');
          generateNewKey(); // Immediate reset
        }
        return newCount;
      });
    }
  }, [isActive, currentKey, distance, onFinish, onCrash]);

  useEffect(() => {
    window.addEventListener('keydown', handleInput);
    return () => window.removeEventListener('keydown', handleInput);
  }, [handleInput]);

  return (
    <div className="manual-driving-console" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 20px',
      boxSizing: 'border-box',
      background: 'rgba(0, 10, 20, 0.95)',
      borderTop: '2px solid var(--accent-primary)',
      fontFamily: 'var(--font-mono)',
      overflow: 'hidden'
    }}>
      {/* Top Row: Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
        fontSize: '0.9rem',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
      }}>
        <div style={{ color: 'var(--accent-secondary)' }}>
          TARGET: <span style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{distance}m</span>
        </div>
        <div style={{ color: durability < 40 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
          INTEGRITY: {durability}%
        </div>
      </div>

      {/* Middle Row: Action Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Key Prompt */}
        <div style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          color: isActive ? 'var(--text-main)' : '#555',
          textShadow: isActive ? '0 0 15px var(--accent-primary)' : 'none',
          border: `2px solid ${isActive ? 'var(--accent-primary)' : '#333'}`,
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          background: '#000'
        }}>
          {currentKey ? KEY_DISPLAY[currentKey] : '-'}
        </div>

        {/* Timer Bar */}
        <div style={{ 
          width: '100%', 
          maxWidth: '300px',
          height: '8px', 
          background: '#222', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${timeLeft}%`,
            height: '100%',
            background: timeLeft < 30 ? 'var(--accent-warning)' : 'var(--accent-primary)',
            transition: 'width 0.05s linear'
          }} />
        </div>
      </div>

      {/* Bottom Row: Feedback */}
      <div style={{ 
        textAlign: 'center', 
        color: feedbackColor,
        fontSize: '1rem',
        fontWeight: 'bold',
        height: '24px',
        marginTop: '5px'
      }}>
        {feedback}
      </div>
    </div>
  );
};

export default ManualDrivingConsole;
