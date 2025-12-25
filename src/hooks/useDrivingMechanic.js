import { useState, useEffect, useCallback } from 'react';

export const useDrivingMechanic = (gameState, send) => {
  const [drivingTimeLeft, setDrivingTimeLeft] = useState(3000);
  const [drivingMaxDuration, setDrivingMaxDuration] = useState(3000);
  const [drivingStrikes, setDrivingStrikes] = useState(0);
  const [isDrivingActive, setIsDrivingActive] = useState(false);

  // Sync active state with game state
  useEffect(() => {
    if (gameState === 'driving') {
      setIsDrivingActive(true);
      // Reset stats on entry
      setDrivingTimeLeft(3000);
      setDrivingMaxDuration(3000);
      setDrivingStrikes(0);
    } else {
      setIsDrivingActive(false);
    }
  }, [gameState]);

  // Timer Logic
  useEffect(() => {
    // If not driving, stop the timer completely
    if (!isDrivingActive) return;

    const timer = setInterval(() => {
      setDrivingTimeLeft((prev) => {
        if (prev <= 10) {
          // Timeout / Failure
          setDrivingStrikes((s) => {
            const newStrikes = s + 1;
            if (newStrikes >= 3) {
              // Trigger Game Over / Stall
              send({ type: 'ENGINE_STALL' });
              setIsDrivingActive(false); 
            }
            return newStrikes;
          });
          // Reset difficulty on fail
          setDrivingMaxDuration(3000);
          return 3000; 
        }
        return prev - 10;
      });
    }, 10);

    return () => clearInterval(timer);
  }, [isDrivingActive, send]);

  // Interaction Handler (Click or Key)
  const handleDriveInput = useCallback((e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (!isDrivingActive) return;

    // Success Logic
    setDrivingMaxDuration((prev) => {
        const newMax = Math.max(500, prev * 0.9); // Speed up by 10%
        setDrivingTimeLeft(newMax); // Reset time to new max
        return newMax;
    });
  }, [isDrivingActive]);

  return {
    drivingTimeLeft,
    drivingMaxDuration,
    drivingStrikes,
    isDrivingActive,
    handleDriveInput
  };
};
