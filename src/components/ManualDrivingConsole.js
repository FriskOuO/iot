import React, { useState, useEffect, useCallback, useRef } from 'react';

const KEYS = ['W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const KEY_DISPLAY = {
  'W': 'W', 'A': 'A', 'S': 'S', 'D': 'D',
  'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→'
};

const ManualDrivingConsole = ({ distance, onDistanceChange, onCrash, onFinish }) => {
  // const [distance, setDistance] = useState(500); // Removed local state
  const [durability, setDurability] = useState(100);
  const [currentKey, setCurrentKey] = useState(null);
  const [feedback, setFeedback] = useState('WAITING FOR SIGNAL...');
  const [feedbackColor, setFeedbackColor] = useState('var(--accent-primary)');
  const [timeLeft, setTimeLeft] = useState(100); // Percentage
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const MOVE_DISTANCE = 25;
  const TIME_LIMIT = 2000; // 2 seconds per key

  // Initialize
  useEffect(() => {
    startRound();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startRound = () => {
    cleanup();
    
    if (distance <= 0) {
      onFinish();
      return;
    }

    const nextKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    setCurrentKey(nextKey);
    setTimeLeft(100);
    setIsActive(true);
    setFeedback('PRESS KEY');
    setFeedbackColor('var(--text-main)');

    // Start Timer (Visual + Logic)
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TIME_LIMIT) * 100);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimeout();
      }
    }, 50);
  };

  const handleTimeout = () => {
    cleanup();
    setIsActive(false);
    applyDamage(20, "TIMEOUT! ENGINE STALL");
  };

  const applyDamage = (amount, msg) => {
    const newDurability = durability - amount;
    setDurability(newDurability);
    setFeedback(msg);
    setFeedbackColor('var(--accent-warning)');

    // Shake effect or visual cue could go here
    
    if (newDurability <= 0) {
      if (onCrash) onCrash();
    } else {
      // Recover after short delay
      timerRef.current = setTimeout(() => {
        startRound();
      }, 1000);
    }
  };

  const handleInput = useCallback((e) => {
    if (!isActive || !currentKey) return;

    // Normalize key input
    // Arrow keys come as "ArrowUp", letters as "KeyW" or just "w" depending on event
    // We'll use e.key which is usually "ArrowUp" or "w"
    const inputKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    
    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt'].includes(inputKey)) return;

    if (inputKey === currentKey) {
      // Success
      cleanup();
      const newDist = Math.max(0, distance - MOVE_DISTANCE);
      onDistanceChange(newDist); // Use prop instead of local state
      setFeedback('PERFECT SHIFT');
      setFeedbackColor('var(--accent-success)');
      
      if (newDist <= 0) {
        onFinish();
      } else {
        // Immediate next round for flow
        setTimeout(startRound, 100); 
      }
    } else {
      // Wrong Key
      cleanup();
      setIsActive(false);
      applyDamage(10, `WRONG INPUT! (${inputKey})`);
    }
  }, [isActive, currentKey, distance, durability, onFinish, onCrash]);

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
