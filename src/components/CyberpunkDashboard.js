import React, { useEffect, useRef } from 'react';
import './CyberpunkUI.css';

const CyberpunkDashboard = ({ currentState, distance, logs = [] }) => {
  const logEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // State display mapping
  const stateLabels = {
    'start': '🌐 系統載入',
    'intro1': '序章：加班',
    'intro2': '序章：傳送',
    'intro3': '序章：異世界',
    'introStory1': '序章：載入中 (1/3)',
    'introStory2': '序章：載入中 (2/3)',
    'introStory3': '序章：載入中 (3/3)',
    'inCar': '車內待命',
    'qteSequence': 'QTE挑戰中',
    'engineStall': '引擎熄火',
    'driving': '駕駛中',
    'atGate': '閘門前',
    'gateOpening': '閘門開啟',
    'parked': '已停車',
    'interactCat': '🐱 遭遇迷因貓',
    'interactSpaghetti': '🍝 義大利麵',
    'interactExit': '🧱 地圖邊界',
    'endingBlackHole': '🌌 結局：黑洞',
    'endingCatChaos': '😵 結局：混亂',
    'endingSpaghettiDance': '💃 結局：熱舞',
    'endingAdmin': '👮 結局：封鎖',
    'endingBSOD': '💀 結局：當機',
    'paymentNarrative': '繳費說明',
    'paymentInput': '📧 輸入信箱',
    'sendingEmail': '📨 發送中',
    'finished': '🎉 遊戲結束',
    'inputEmail': '輸入信箱',
    'ntpPing': 'NTP 連接中',
    'ntpSync': 'NTP 同步中',
    'paymentInfo': '待繳費',
    'paymentSuccess': '繳費完成'
  };

  const distancePercent = Math.min((distance / 500) * 100, 100);

  // 🚦 動態警示系統 - 根據距離計算警示等級和顏色（總距離 500cm）
  const getWarningStatus = (dist, state) => {
    // 停車後停止警示，顯示完成狀態
    if (state === 'parked') {
      return {
        level: 'completed',
        color: '#05d9e8',
        barColor: 'linear-gradient(90deg, #05d9e8, #00ff88)',
        label: '🎉 已停車',
        glowColor: 'rgba(5, 217, 232, 0.3)',
        animation: 'none'
      };
    }
    
    // 遊戲開始/載入狀態
    if (state === 'start') {
      return {
        level: 'loading',
        color: '#05d9e8',
        barColor: 'linear-gradient(90deg, #05d9e8, #00ff88)',
        label: '🌐 系統載入中',
        glowColor: 'rgba(5, 217, 232, 0.3)',
        animation: 'none'
      };
    }
    
    // 車內待命、QTE、引擎相關狀態
    if (state === 'inCar' || state === 'qteSequence' || state === 'engineStall') {
      return {
        level: 'ready',
        color: '#00ff88',
        barColor: 'linear-gradient(90deg, #00ff88, #00ffff)',
        label: '🚗 車輛待命',
        glowColor: 'rgba(0, 255, 136, 0.3)',
        animation: 'none'
      };
    }
    
    // 下車後與 NPC 互動狀態 - 統一顯示互動中
    if (state === 'interactCat' || state === 'interactSpaghetti' || state === 'interactExit') {
      return {
        level: 'interact',
        color: '#00ff88',
        barColor: 'linear-gradient(90deg, #00ff88, #00ffff)',
        label: '🎮 互動中',
        glowColor: 'rgba(0, 255, 136, 0.3)',
        animation: 'none'
      };
    }
    
    // 結局狀態 - 顯示特殊警告
    if (state === 'endingBlackHole' || state === 'endingCatChaos' || 
        state === 'endingSpaghettiDance' || state === 'endingAdmin' || state === 'endingBSOD') {
      return {
        level: 'ending',
        color: '#ff2a6d',
        barColor: 'linear-gradient(90deg, #ff2a6d, #ff0066)',
        label: '🌀 異常事件',
        glowColor: 'rgba(255, 42, 109, 0.5)',
        animation: 'pulse 1s infinite'
      };
    }
    
    // 後續劇情狀態（繳費、NTP 等）
    if (state === 'paymentNarrative' || state === 'paymentInput' || state === 'sendingEmail' ||
        state === 'ntpPing' || state === 'ntpSync' || state === 'finished' ||
        state === 'paymentInfo' || state === 'inputEmail' || state === 'paymentSuccess') {
      return {
        level: 'system',
        color: '#05d9e8',
        barColor: 'linear-gradient(90deg, #05d9e8, #00ff88)',
        label: state === 'finished' ? '🎮 遊戲結束' : '💳 系統處理中',
        glowColor: 'rgba(5, 217, 232, 0.3)',
        animation: 'none'
      };
    }
    
    // 駕駛中的距離警示（基於 500cm 總距離）
    if (dist <= 50) {
      return {
        level: 'danger',
        color: '#ff0000',
        barColor: 'linear-gradient(90deg, #ff0000, #ff4444)',
        label: '⚠️ 危險',
        glowColor: 'rgba(255, 0, 0, 0.5)',
        animation: 'pulse 0.5s infinite'
      };
    } else if (dist <= 150) {
      return {
        level: 'warning',
        color: '#ff8800',
        barColor: 'linear-gradient(90deg, #ff8800, #ffaa00)',
        label: '⚡ 注意',
        glowColor: 'rgba(255, 136, 0, 0.4)',
        animation: 'pulse 1s infinite'
      };
    } else if (dist <= 300) {
      return {
        level: 'caution',
        color: '#ffff00',
        barColor: 'linear-gradient(90deg, #ffff00, #ffff88)',
        label: '👀 小心',
        glowColor: 'rgba(255, 255, 0, 0.3)',
        animation: 'none'
      };
    } else {
      return {
        level: 'safe',
        color: '#00ff00',
        barColor: 'linear-gradient(90deg, #00ff88, #00ffff)',
        label: '✅ 安全',
        glowColor: 'rgba(0, 255, 0, 0.2)',
        animation: 'none'
      };
    }
  };

  const warningStatus = getWarningStatus(distance, currentState);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-header">
        // 系統監控面板 // 版本 v2.0.45
      </div>
      
      <div className="dashboard-content">
        {/* System Status */}
        <div className="status-module">
          <span className="module-label">系統狀態</span>
          <div 
            className="module-value" 
            style={{ 
              color: warningStatus.color,
              textShadow: `0 0 10px ${warningStatus.glowColor}`,
              animation: warningStatus.animation,
              transition: 'all 0.3s ease'
            }}
          >
            {/* 根據不同狀態顯示對應的文字 */}
            {currentState === 'parked' || currentState === 'start' || 
             currentState === 'inCar' || currentState === 'qteSequence' || currentState === 'engineStall'
              ? stateLabels[currentState] || currentState
              : (currentState === 'interactCat' || currentState === 'interactSpaghetti' || 
                 currentState === 'interactExit' || currentState.startsWith('ending') ||
                 currentState === 'paymentNarrative' || currentState === 'paymentInput' || 
                 currentState === 'sendingEmail' || currentState === 'finished' ||
                 currentState === 'ntpPing' || currentState === 'ntpSync' || 
                 currentState === 'paymentInfo' || currentState === 'inputEmail' || 
                 currentState === 'paymentSuccess')
              ? stateLabels[currentState] || warningStatus.label
              : warningStatus.label}
          </div>
        </div>

        {/* Sensor Data */}
        <div 
          className="status-module"
          style={{
            border: `2px solid ${warningStatus.color}`,
            boxShadow: `0 0 20px ${warningStatus.glowColor}`,
            transition: 'all 0.3s ease'
          }}
        >
          <span className="module-label">距離感測模組</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span 
              className="module-value"
              style={{
                color: warningStatus.color,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: `0 0 10px ${warningStatus.glowColor}`,
                transition: 'all 0.3s ease'
              }}
            >
              {distance} 公分
            </span>
            <span style={{ fontSize: '0.8rem', color: warningStatus.color }}>
              {/* 根據狀態顯示不同的標籤 */}
              {currentState === 'parked' 
                ? '已停' 
                : currentState === 'start'
                ? '載入'
                : (currentState === 'inCar' || currentState === 'qteSequence' || currentState === 'engineStall')
                ? '待命'
                : (currentState === 'interactCat' || currentState === 'interactSpaghetti' || currentState === 'interactExit')
                ? '互動'
                : currentState.startsWith('ending')
                ? '事件'
                : (currentState === 'paymentInput' || currentState === 'sendingEmail' ||
                   currentState === 'finished' || currentState === 'paymentSuccess' || 
                   currentState === 'paymentNarrative' || currentState === 'ntpPing' || 
                   currentState === 'ntpSync' || currentState === 'paymentInfo' || 
                   currentState === 'inputEmail')
                ? (currentState === 'finished' ? '完成' : '處理中')
                : warningStatus.level === 'danger' ? '危險' :
                  warningStatus.level === 'warning' ? '注意' :
                  warningStatus.level === 'caution' ? '小心' : '距離'}
            </span>
          </div>
          <div 
            className="health-bar-container"
            style={{
              boxShadow: `inset 0 0 10px ${warningStatus.glowColor}`,
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="health-bar-fill" 
              style={{ 
                width: `${distancePercent}%`,
                background: warningStatus.barColor,
                boxShadow: `0 0 15px ${warningStatus.glowColor}`,
                animation: warningStatus.level === 'danger' ? 'pulse 0.5s infinite' : 'none',
                transition: 'all 0.3s ease'
              }}
            ></div>
          </div>
        </div>

        {/* Logs Console */}
        <div className="logs-console">
          <div ref={logEndRef} />
          {logs.slice().reverse().map((log, index) => (
            <div key={index} className="log-entry">
              <span className="log-timestamp">
                [{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}]
              </span>
              <span className={`log-type-${log.type}`}>
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CyberpunkDashboard;
