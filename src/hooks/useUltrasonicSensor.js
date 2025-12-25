import { useState, useEffect, useCallback } from 'react';

/**
 * HC-SR04 超聲波感測器模擬 Hook
 * 
 * 工作原理：
 * 1. Trigger 引腳發出 10μs 的高電平脈衝
 * 2. 感測器發出 8 個 40kHz 的超聲波脈衝
 * 3. Echo 引腳接收返回信號，輸出高電平持續時間
 * 4. 距離計算: Distance (cm) = (Duration_μs * 0.0343) / 2
 *    - 聲速: 343 m/s = 0.0343 cm/μs
 *    - 除以 2 是因為聲波往返兩次
 */
export const useUltrasonicSensor = (actualDistance) => {
  const [sensorData, setSensorData] = useState({
    triggerTime: 0,
    echoStartTime: 0,
    echoEndTime: 0,
    duration: 0, // 微秒
    measuredDistance: 0, // cm
    isTriggering: false,
    isEchoing: false,
  });

  const [history, setHistory] = useState([]);

  // 添加隨機噪聲，模擬真實感測器的誤差
  const addNoise = useCallback((value) => {
    const noise = (Math.random() - 0.5) * 2; // ±1 cm 的隨機誤差
    return Math.max(0, value + noise);
  }, []);

  // 模擬 HC-SR04 的測量週期
  const triggerMeasurement = useCallback(() => {
    // 步驟 1: Trigger 訊號 (10μs)
    const triggerTime = Date.now();
    setSensorData(prev => ({
      ...prev,
      triggerTime,
      isTriggering: true,
    }));

    // 步驟 2: 等待超聲波發送 (模擬延遲)
    setTimeout(() => {
      setSensorData(prev => ({
        ...prev,
        isTriggering: false,
        isEchoing: true,
        echoStartTime: Date.now(),
      }));

      // 步驟 3: 計算 Echo 持續時間
      // Duration (μs) = Distance (cm) * 2 / 0.0343
      const theoreticalDuration = (actualDistance * 2) / 0.0343;
      
      // 添加噪聲
      const noisyDuration = theoreticalDuration + (Math.random() - 0.5) * 100;
      
      // 步驟 4: 計算測量距離
      const measuredDistance = addNoise((noisyDuration * 0.0343) / 2);

      setTimeout(() => {
        const echoEndTime = Date.now();
        const newData = {
          triggerTime,
          echoStartTime: triggerTime + 10,
          echoEndTime,
          duration: noisyDuration,
          measuredDistance: Math.round(measuredDistance * 10) / 10, // 保留 1 位小數
          isTriggering: false,
          isEchoing: false,
        };

        setSensorData(newData);

        // 記錄歷史數據
        setHistory(prev => [
          ...prev.slice(-50), // 只保留最近 50 筆記錄
          {
            timestamp: Date.now(),
            distance: newData.measuredDistance,
            duration: newData.duration,
          },
        ]);
      }, 50); // 模擬 Echo 訊號返回時間
    }, 10); // Trigger 訊號持續時間
  }, [actualDistance, addNoise]);

  // 自動測量 (每 100ms 觸發一次，模擬連續測量)
  useEffect(() => {
    const interval = setInterval(() => {
      triggerMeasurement();
    }, 100);

    return () => clearInterval(interval);
  }, [triggerMeasurement]);

  // 生成 CoAP 封包模擬 (教育用途)
  const generateCoapPacket = useCallback(() => {
    const distance = sensorData.measuredDistance;
    
    // CoAP Header (簡化版)
    const version = 1; // 2 bits
    const type = 0; // 2 bits (CON)
    const tokenLength = 4; // 4 bits
    const code = 0x45; // 8 bits (2.05 Content)
    const messageId = Math.floor(Math.random() * 65535); // 16 bits
    
    // 構建十六進制表示
    const header = [
      `0x${((version << 6) | (type << 4) | tokenLength).toString(16).padStart(2, '0')}`,
      `0x${code.toString(16).padStart(2, '0')}`,
      `0x${((messageId >> 8) & 0xFF).toString(16).padStart(2, '0')}`,
      `0x${(messageId & 0xFF).toString(16).padStart(2, '0')}`,
    ];
    
    // Payload (距離數據)
    const payload = JSON.stringify({ distance, unit: 'cm' });
    
    return {
      header: header.join(' '),
      payload,
      fullPacket: `${header.join(' ')} | ${payload}`,
    };
  }, [sensorData.measuredDistance]);

  return {
    sensorData,
    history,
    triggerMeasurement,
    generateCoapPacket,
  };
};
