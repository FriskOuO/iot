import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DrivingQTE.css';

const DrivingQTE = ({ onStall, onComplete, isActive = true }) => {
  // Game State
  const [maxTime, setMaxTime] = useState(3000); // Initial 3.0s
  const [timeLeft, setTimeLeft] = useState(3000);
  const [strikes, setStrikes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);
  
  // Refs for mutable state in interval
  const stateRef = useRef({
    timeLeft: 3000,
    maxTime: 3000,
    strikes: 0,
    isActive: isActive
  });

  // Sync refs with props/state
  useEffect(() => {
    stateRef.current.isActive = isActive;
  }, [isActive]);

  // Timer Logic
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      // Decrement time
      stateRef.current.timeLeft -= 10; // 10ms tick
      setTimeLeft(stateRef.current.timeLeft);

      // Check for Timeout (Failure)
      if (stateRef.current.timeLeft <= 0) {
        handleFailure();
      }
    }, 10);

    return () => clearInterval(timer);
  }, [isActive]);

  const handleFailure = () => {
    // 1. Record Strike
    const newStrikes = stateRef.current.strikes + 1;
    stateRef.current.strikes = newStrikes;
    setStrikes(newStrikes);

    // 2. Reset Difficulty (Momentum Lost)
    stateRef.current.maxTime = 3000;
    setMaxTime(3000);
    
    // 3. Reset Timer for next round
    stateRef.current.timeLeft = 3000;
    setTimeLeft(3000);

    // 4. Reset Combo
    setCombo(0);

    // 5. Visual Glitch
    setShowGlitch(true);
    setTimeout(() => setShowGlitch(false), 200);

    // 6. Check Game Over
    if (newStrikes >= 3) {
      if (onStall) onStall();
    }
  };

  const handleSuccess = useCallback(() => {
    // 1. Increase Combo
    setCombo(prev => prev + 1);

    // 2. Increase Difficulty (Faster!)
    // Multiply by 0.9 but cap at 500ms minimum to be fair
    const newMaxTime = Math.max(stateRef.current.maxTime * 0.9, 500);
    stateRef.current.maxTime = newMaxTime;
    setMaxTime(newMaxTime);

    // 3. Reset Timer immediately
    stateRef.current.timeLeft = newMaxTime;
    setTimeLeft(newMaxTime);

    // Optional: Check for Win Condition (e.g. 20 combo)
    // if (combo > 20 && onComplete) onComplete();
  }, []);

  // Input Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        handleSuccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSuccess]);

  // Calculate Visuals
  const progressPercentage = Math.max(0, (timeLeft / maxTime) * 100);
  
  // Determine Color Class
  let barClass = 'rhythm-bar-fill';
  if (progressPercentage < 30) barClass += ' critical';
  else if (progressPercentage < 60) barClass += ' warning';

  return (
    <div className="driving-qte-container">
      {showGlitch && <div className="glitch-overlay"></div>}
      
      <div className="driving-stats">
        <div>
          <span className="stat-label">ENGINE STABILITY</span>
          <span className={`stat-value ${strikes > 0 ? 'danger' : ''}`}>
            {3 - strikes} / 3
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="stat-label">MOMENTUM COMBO</span>
          <span className="stat-value">{combo}x</span>
        </div>
      </div>

      <div className="rhythm-bar-container">
        <div 
          className={barClass} 
          style={{ width: `${progressPercentage}%` }}
        ></div>
        {/* Optional: Visual marker for "danger zone" */}
        <div className="target-zone"></div>
      </div>

      <div className="instruction-text">
        PRESS <span className="key-hint">SPACE</span> TO SHIFT GEAR
      </div>
    </div>
  );
};

export default DrivingQTE;
