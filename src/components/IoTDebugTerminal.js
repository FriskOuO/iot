import React, { useEffect, useState } from 'react';
import './IoTDebugTerminal.css';

/**
 * IoT Debug Terminal - 右側面板
 * 顯示所有後端模擬的協議日誌
 */

const IoTDebugTerminal = ({ context, sensorData, coapPacket }) => {
  const [logs, setLogs] = useState([]);
  const [sqlLogs, setSqlLogs] = useState([
    { id: 1, plate: 'ABC-1234', entryTime: '2025-12-24 10:30:00', fee: '0.00' },
    { id: 2, plate: 'XYZ-5678', entryTime: '2025-12-24 09:15:00', fee: '15.00' }
  ]);
  const [httpsHandshake, setHttpsHandshake] = useState([]);
  const [ntpSync, setNtpSync] = useState(null);

  // 添加日誌
  const addLog = (type, message) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { type, message, timestamp }].slice(-50)); // 保留最後 50 條
  };

  // 模擬 HTTPS TLS 握手（應用啟動時）
  useEffect(() => {
    const simulateTLSHandshake = () => {
      const handshake = [
        '🔒 Initiating HTTPS Connection to server.example.com:443',
        '📤 ClientHello: TLS 1.3, Cipher Suites: TLS_AES_128_GCM_SHA256',
        '📥 ServerHello: TLS 1.3, Cipher Suite: TLS_AES_128_GCM_SHA256',
        '🔑 Certificate Received: CN=server.example.com, Valid Until: 2026-12-31',
        '✅ Certificate Verified: Issuer=Let\'s Encrypt Authority',
        '🤝 Key Exchange Complete: ECDHE (X25519)',
        '✅ Handshake Finished: Encrypted Tunnel Established',
        '🔐 Application Data: Ready for Secure Communication'
      ];
      setHttpsHandshake(handshake);
    };

    simulateTLSHandshake();
  }, []);

  // 模擬 NTP 時間同步
  useEffect(() => {
    const syncNTP = () => {
      addLog('NTP', '⏰ Connecting to pool.ntp.org...');
      
      setTimeout(() => {
        const offset = Math.random() * 10 - 5; // ±5ms 偏移
        const ntpTime = new Date();
        setNtpSync({
          server: 'pool.ntp.org',
          offset: offset.toFixed(3),
          synced: ntpTime.toLocaleString('zh-TW')
        });
        addLog('NTP', `✅ Time Synced: Offset ${offset.toFixed(3)}ms`);
      }, 1000);
    };

    syncNTP();
    const interval = setInterval(syncNTP, 30000); // 每 30 秒同步一次
    return () => clearInterval(interval);
  }, []);

  // 監聽 MQTT 訊息
  useEffect(() => {
    if (context.logs && context.logs.length > 0) {
      const latestLog = context.logs[context.logs.length - 1];
      if (latestLog.includes('MQTT') || latestLog.includes('OPEN_GATE')) {
        addLog('MQTT', `📡 Topic: parking/gate/control | Payload: {"cmd":"OPEN","timestamp":"${new Date().toISOString()}"}`);
      }
    }
  }, [context.logs]);

  // 監聽感測器更新（CoAP 模擬）
  useEffect(() => {
    if (sensorData && sensorData.distance !== undefined) {
      // 生成 CoAP 模擬封包
      const hexPacket = coapPacket || generateCoapHex(sensorData.distance);
      addLog('CoAP', `📦 CON [0.01] GET /sensor/distance | Hex: ${hexPacket.slice(0, 40)}...`);
    }
  }, [sensorData, coapPacket]);

  // 生成 CoAP Hex（如果沒有從外部提供）
  const generateCoapHex = (distance) => {
    const bytes = [
      0x40, // Ver=1, Type=CON, TKL=0
      0x01, // Code=GET
      Math.floor(Math.random() * 256), // Message ID
      Math.floor(Math.random() * 256),
      0xb2, // Uri-Path Option
      0x73, 0x65, 0x6e, 0x73, 0x6f, 0x72, // "sensor"
      0xff, // Payload marker
      ...Array.from(distance.toString()).map(c => c.charCodeAt(0))
    ];
    return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
  };

  // 模擬 SMTP 發送收據（離開停車場時）
  const sendSMTPReceipt = () => {
    addLog('SMTP', '📧 Connecting to mail.server.com:587...');
    setTimeout(() => {
      addLog('SMTP', '✅ 220 mail.server.com ESMTP Ready');
      addLog('SMTP', '📤 EHLO localhost');
      addLog('SMTP', '✅ 250 OK');
      addLog('SMTP', '📤 MAIL FROM: <noreply@parking.com>');
      addLog('SMTP', '✅ 250 OK');
      addLog('SMTP', '📤 RCPT TO: <user@example.com>');
      addLog('SMTP', '✅ 250 OK');
      addLog('SMTP', '📤 DATA');
      addLog('SMTP', '✅ 354 Start mail input');
      addLog('SMTP', '📧 Sending Receipt... Total Fee: NT$50');
      addLog('SMTP', '✅ 250 OK: Message accepted');
      addLog('SMTP', '🔌 QUIT');
    }, 500);
  };

  // 渲染日誌條目
  const renderLog = (log, index) => {
    let icon = '📝';
    let className = 'log-entry';

    if (log.type === 'MQTT') {
      icon = '📡';
      className += ' log-mqtt';
    } else if (log.type === 'CoAP') {
      icon = '📦';
      className += ' log-coap';
    } else if (log.type === 'NTP') {
      icon = '⏰';
      className += ' log-ntp';
    } else if (log.type === 'SMTP') {
      icon = '📧';
      className += ' log-smtp';
    } else if (log.type === 'SQL') {
      icon = '🗄️';
      className += ' log-sql';
    }

    return (
      <div key={index} className={className}>
        <span className="log-icon">{icon}</span>
        <span className="log-timestamp">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
        <span className="log-type">[{log.type}]</span>
        <span className="log-message">{log.message}</span>
      </div>
    );
  };

  return (
    <div className="iot-debug-terminal">
      <div className="terminal-header">
        <h2>🔧 IoT Debug Terminal</h2>
        <div className="terminal-status">
          <span className="status-dot connected"></span>
          Connected
        </div>
      </div>

      {/* HTTPS TLS 握手面板 */}
      <div className="terminal-section">
        <h3>🔒 HTTPS TLS Handshake</h3>
        <div className="https-panel">
          {httpsHandshake.map((step, i) => (
            <div key={i} className="https-step">{step}</div>
          ))}
        </div>
      </div>

      {/* NTP 時間同步 */}
      <div className="terminal-section">
        <h3>⏰ NTP Time Sync</h3>
        {ntpSync && (
          <div className="ntp-panel">
            <div className="ntp-row">
              <span className="ntp-label">Server:</span>
              <span className="ntp-value">{ntpSync.server}</span>
            </div>
            <div className="ntp-row">
              <span className="ntp-label">Offset:</span>
              <span className="ntp-value">{ntpSync.offset} ms</span>
            </div>
            <div className="ntp-row">
              <span className="ntp-label">Synced Time:</span>
              <span className="ntp-value">{ntpSync.synced}</span>
            </div>
          </div>
        )}
      </div>

      {/* SQL 停車記錄 */}
      <div className="terminal-section">
        <h3>🗄️ SQL Parking Logs</h3>
        <div className="sql-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>License Plate</th>
                <th>Entry Time (NTP)</th>
                <th>Fee (NT$)</th>
              </tr>
            </thead>
            <tbody>
              {sqlLogs.map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.plate}</td>
                  <td>{row.entryTime}</td>
                  <td>{row.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 協議日誌流 */}
      <div className="terminal-section">
        <h3>📜 Protocol Logs (MQTT / CoAP)</h3>
        <div className="log-stream">
          {logs.length === 0 ? (
            <div className="log-empty">等待 IoT 事件...</div>
          ) : (
            logs.map((log, i) => renderLog(log, i))
          )}
        </div>
      </div>

      {/* HC-SR04 感測器數據 */}
      <div className="terminal-section">
        <h3>📡 HC-SR04 Ultrasonic Sensor</h3>
        <div className="sensor-panel">
          <div className="sensor-row">
            <span className="sensor-label">Distance:</span>
            <span className="sensor-value">{sensorData?.distance?.toFixed(2) || 'N/A'} cm</span>
          </div>
          <div className="sensor-row">
            <span className="sensor-label">Duration:</span>
            <span className="sensor-value">{sensorData?.duration?.toFixed(2) || 'N/A'} µs</span>
          </div>
          <div className="sensor-row">
            <span className="sensor-label">Temperature:</span>
            <span className="sensor-value">{sensorData?.temperature || 25} °C</span>
          </div>
          <div className="sensor-row">
            <span className="sensor-label">Speed of Sound:</span>
            <span className="sensor-value">
              {(331.3 + 0.606 * (sensorData?.temperature || 25)).toFixed(2)} m/s
            </span>
          </div>
        </div>
      </div>

      {/* SMTP 測試按鈕 */}
      <div className="terminal-section">
        <h3>📧 SMTP Receipt</h3>
        <button className="smtp-button" onClick={sendSMTPReceipt}>
          🚀 Simulate Email Receipt
        </button>
      </div>
    </div>
  );
};

export default IoTDebugTerminal;
