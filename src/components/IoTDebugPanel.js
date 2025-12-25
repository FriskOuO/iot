import React, { useRef, useEffect } from 'react';
import './IoTDebugPanel.css';

/**
 * IoT Debug Dashboard Component
 * Displays sensor data, system status, and protocol logs
 */
const IoTDebugPanel = ({ 
  currentState, 
  distance, 
  logs = [] 
}) => {
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
    'intro4': '序章：發現',
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

  // Log type color mapping
  const logTypeClasses = {
    'system': 'log-text-system',
    'mqtt': 'log-text-mqtt',
    'coap': 'log-text-coap',
    'sensor': 'log-text-sensor',
    'qte': 'log-text-qte',
    'action': 'log-text-action',
    'success': 'log-text-success',
    'fail': 'log-text-fail',
    'narrative': 'log-text-narrative',
    'sql': 'log-text-sql',
    'ntp': 'log-text-ntp',
    'smtp': 'log-text-smtp'
  };

  // Distance indicator color
  const getDistanceClass = () => {
    if (distance > 200) return 'progress-green';
    if (distance > 100) return 'progress-yellow';
    if (distance > 50) return 'progress-orange';
    return 'progress-red';
  };

  const distancePercent = Math.min((distance / 500) * 100, 100);
  const stateBadgeClass = `status-badge status-badge-${currentState}`;

  return (
    <div className="iot-panel">
      {/* Header */}
      <div className="iot-header">
        <h2 className="iot-title">
          🔧 IoT 數位分身
        </h2>
        <p className="iot-subtitle">即時感測器數據與協議監控</p>
      </div>

      {/* Status Panel */}
      <div className="status-panel">
        <h3 className="status-title">
          <span className="status-icon">📊</span> 系統狀態
        </h3>
        
        <div className="status-row">
          <span className="status-label">當前狀態:</span>
          <span className={stateBadgeClass}>
            {stateLabels[currentState] || currentState}
          </span>
        </div>
        
        <div className="status-row">
          <span className="status-label">時間戳記:</span>
          <span className="status-value">{new Date().toLocaleTimeString('zh-TW')}</span>
        </div>
      </div>

      {/* Distance Sensor Panel */}
      <div className="sensor-panel">
        <h3 className="sensor-title">
          <span className="status-icon">📡</span> HC-SR04 超聲波感測器
        </h3>
        
        <div className="sensor-distance">
          <span className="status-label">距離:</span>
          <span className="distance-value">{distance} cm</span>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${getDistanceClass()}`}
            style={{ width: `${distancePercent}%` }}
          >
            {distancePercent.toFixed(0)}%
          </div>
        </div>

        <div className="progress-labels">
          <span>0 cm</span>
          <span>500 cm</span>
        </div>
      </div>

      {/* Protocol Logs */}
      <div className="logs-panel">
        <h3 className="logs-title">
          <span className="status-icon">📜</span> 協議日誌
        </h3>
        
        <div className="logs-content">
          {logs.length === 0 ? (
            <div className="logs-empty">
              等待事件發生...
            </div>
          ) : (
            <div>
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-timestamp">
                    [{new Date(log.timestamp).toLocaleTimeString('zh-TW', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}]
                  </span>
                  <span className={logTypeClasses[log.type] || 'log-text-system'}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="panel-footer">
        <span>總事件: {logs.length}</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
};

export default IoTDebugPanel;
