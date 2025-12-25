import { useState, useEffect, useRef } from 'react';

/**
 * VirtualHardware Hook - 模擬 HC-SR04 感測器物理行為
 * 
 * 功能：
 * - 平滑動畫距離變化
 * - 模擬感測器雜訊
 * - 計算物理公式 (Duration = Distance * 58.2)
 */

export const useVirtualHardware = (targetDistance, isAnimating = false) => {
  const [currentDistance, setCurrentDistance] = useState(200);
  const [duration, setDuration] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const animationFrameRef = useRef(null);

  // 計算音速（m/s）
  const speedOfSound = 331.3 + 0.606 * temperature;

  // HC-SR04 公式：Duration (μs) = Distance (cm) * 58.2
  // 或更精確: Duration = (Distance * 2) / (SpeedOfSound * 100 / 1e6)
  const calculateDuration = (distance) => {
    const speedInCmPerUs = speedOfSound * 100 / 1e6; // cm/μs
    return (distance * 2) / speedInCmPerUs;
  };

  // 添加雜訊（±2cm）
  const addNoise = (value) => {
    const noise = (Math.random() - 0.5) * 4;
    return value + noise;
  };

  // 緩動函數（easeOutCubic）
  const easeOutCubic = (t) => {
    return 1 - Math.pow(1 - t, 3);
  };

  useEffect(() => {
    if (!isAnimating) {
      setCurrentDistance(targetDistance);
      setDuration(calculateDuration(targetDistance));
      return;
    }

    // 動畫參數
    const startDistance = currentDistance;
    const endDistance = targetDistance;
    const duration = 2000; // 2 秒
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const interpolatedDistance = 
        startDistance + (endDistance - startDistance) * easedProgress;

      const noisyDistance = addNoise(interpolatedDistance);
      setCurrentDistance(noisyDistance);
      setDuration(calculateDuration(noisyDistance));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetDistance, isAnimating]);

  // 溫度隨機變化（模擬環境）
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature(prev => {
        const change = (Math.random() - 0.5) * 0.5;
        return Math.max(20, Math.min(30, prev + change));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return {
    distance: currentDistance,
    duration,
    temperature,
    speedOfSound,
    rawHex: generateCoapHex(currentDistance)
  };
};

// 生成 CoAP Hex 封包
const generateCoapHex = (distance) => {
  const bytes = [
    0x40, // Ver=1, Type=CON, TKL=0
    0x01, // Code=GET
    Math.floor(Math.random() * 256), // Message ID (random)
    Math.floor(Math.random() * 256),
    0xb2, // Uri-Path Option
    0x73, 0x65, 0x6e, 0x73, 0x6f, 0x72, // "sensor"
    0xff, // Payload marker
    ...Array.from(Math.round(distance).toString()).map(c => c.charCodeAt(0))
  ];

  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
};
