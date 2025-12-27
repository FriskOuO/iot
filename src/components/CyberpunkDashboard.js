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
    'outsideCar': '車外',
    'inputEmail': '輸入信箱',
    'ntpSync': 'NTP 同步中',
    'paymentInfo': '待繳費',
    'paymentSuccess': '繳費完成'
  };

  const distancePercent = Math.min((distance / 500) * 100, 100);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-header">
        // 系統監控面板 // 版本 v2.0.45
      </div>
      
      <div className="dashboard-content">
        {/* System Status */}
        <div className="status-module">
          <span className="module-label">系統狀態</span>
          <div className="module-value" style={{ color: 'var(--accent-primary)' }}>
            {stateLabels[currentState] || currentState}
          </div>
        </div>

        {/* Sensor Data */}
        <div className="status-module">
          <span className="module-label">距離感測模組</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="module-value">{distance} 公分</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>距離</span>
          </div>
          <div className="health-bar-container">
            <div 
              className="health-bar-fill" 
              style={{ width: `${distancePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Logs Console */}
        <div className="logs-console">
          <div ref={logEndRef} />
          {logs.slice().reverse().map((log, index) => (
            <div key={index} className="log-entry">
              <span className="log-timestamp">
                [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
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
