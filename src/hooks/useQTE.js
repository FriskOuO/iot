import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook for QTE (Quick Time Event) System
 * Handles keyboard input matching for sequences
 * 
 * @param {Array<string>} sequence - Array of expected key codes (e.g., ['ArrowUp', 'ArrowDown'])
 * @param {number} currentProgress - Current position in the sequence
 * @param {Function} onKeyPress - Callback when a key is pressed
 * @param {Function} onComplete - Callback when sequence is completed
 * @param {boolean} isActive - Whether the QTE is currently active
 * @param {number} timeLimit - Time limit per key in milliseconds (optional)
 */
export const useQTE = ({
  sequence = [],
  currentProgress = 0,
  onKeyPress,
  onComplete,
  onTimeout,
  isActive = false,
  timeLimit = null
}) => {
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Handle key press
  const handleKeyPress = useCallback((event) => {
    if (!isActive || currentProgress >= sequence.length) return;

    const key = event.key;
    
    // Only handle arrow keys
    if (!key.startsWith('Arrow')) return;
    
    event.preventDefault();
    
    // Send the key press to parent component
    if (onKeyPress) {
      onKeyPress(key);
    }

    // Reset timer on successful key press
    if (timeLimit && key === sequence[currentProgress]) {
      clearTimeout(timerRef.current);
      startTimeRef.current = Date.now();
      
      // Start new timer for next key
      if (currentProgress + 1 < sequence.length) {
        timerRef.current = setTimeout(() => {
          if (onTimeout) {
            onTimeout();
          }
        }, timeLimit);
      }
    }
  }, [isActive, currentProgress, sequence, onKeyPress, timeLimit, onTimeout]);

  // Check if sequence is complete
  useEffect(() => {
    if (isActive && currentProgress >= sequence.length && sequence.length > 0) {
      clearTimeout(timerRef.current);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentProgress, sequence.length, isActive, onComplete]);

  // Set up keyboard listener
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyPress);
      
      // Start timer if enabled
      if (timeLimit) {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
          if (onTimeout) {
            onTimeout();
          }
        }, timeLimit);
      }

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
        clearTimeout(timerRef.current);
      };
    }
  }, [isActive, handleKeyPress, timeLimit, onTimeout]);

  // Get remaining time percentage
  const getRemainingTimePercent = useCallback(() => {
    if (!timeLimit || !startTimeRef.current) return 100;
    const elapsed = Date.now() - startTimeRef.current;
    return Math.max(0, ((timeLimit - elapsed) / timeLimit) * 100);
  }, [timeLimit]);

  return {
    getRemainingTimePercent
  };
};
