import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const IoTDashboard = ({ context, sensorData, coapPacket }) => {
  const [mqttLogs, setMqttLogs] = useState([]);

  // 模擬 MQTT 訊息
  useEffect(() => {
    if (sensorData.measuredDistance > 0) {
      const mqttMessage = {
        timestamp: Date.now(),
        topic: 'parking/gate/sensor',
        payload: {
          distance: sensorData.measuredDistance,
          unit: 'cm',
          barrierStatus: context.barrierOpen ? 'open' : 'closed',
        },
      };
      
      setMqttLogs(prev => [...prev.slice(-10), mqttMessage]); // 保留最近 10 筆
    }
  }, [sensorData.measuredDistance, context.barrierOpen]);

  // 準備圖表數據
  const chartData = {
    labels: sensorData.history?.slice(-20).map((_, i) => i) || [],
    datasets: [
      {
        label: '距離 (cm)',
        data: sensorData.history?.slice(-20).map(d => d.distance) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'HC-SR04 超聲波感測器即時數據',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 350,
        title: {
          display: true,
          text: '距離 (cm)',
        },
      },
    },
  };

  return (
    <div className="iot-dashboard">
      <div className="dashboard-header">
        <h2>📡 IoT 儀表板</h2>
        <div className="status-indicator">
          <span className={`status-dot ${sensorData.isEchoing ? 'active' : ''}`}></span>
          感測器狀態: {sensorData.isEchoing ? '測量中' : '待命'}
        </div>
      </div>

      {/* 感測器數據面板 */}
      <div className="sensor-panel">
        <h3>🔬 HC-SR04 超聲波感測器</h3>
        <div className="sensor-data">
          <div className="data-item">
            <span className="label">測量距離:</span>
            <span className="value">{sensorData.measuredDistance?.toFixed(1) || 0} cm</span>
          </div>
          <div className="data-item">
            <span className="label">Echo 持續時間:</span>
            <span className="value">{sensorData.duration?.toFixed(0) || 0} μs</span>
          </div>
          <div className="data-item">
            <span className="label">車輛位置:</span>
            <span className="value">{context.position} cm</span>
          </div>
          <div className="data-item" style={{ 
            borderLeftColor: context.durability > 50 ? '#00ff00' : context.durability > 20 ? '#ffff00' : '#ff0000' 
          }}>
            <span className="label">車輛耐久度:</span>
            <span className="value" style={{ 
              color: context.durability > 50 ? '#00ff00' : context.durability > 20 ? '#ffff00' : '#ff0000' 
            }}>
              {context.durability}%
            </span>
          </div>
        </div>
        
        <div className="formula-box">
          <strong>計算公式:</strong>
          <code>Distance (cm) = (Duration_μs × 0.0343) / 2</code>
          <p className="formula-note">聲速: 343 m/s @ 20°C</p>
        </div>
      </div>

      {/* 即時圖表 */}
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* 柵欄狀態視覺化 */}
      <div className="barrier-visual">
        <h3>🚧 柵欄狀態</h3>
        <div className={`barrier ${context.barrierOpen ? 'open' : 'closed'}`}>
          <div className="barrier-arm">
            {context.barrierOpen ? '⬆️ 開啟' : '➡️ 關閉'}
          </div>
        </div>
      </div>

      {/* MQTT 訊息日誌 */}
      <div className="mqtt-logs">
        <h3>📨 MQTT 訊息日誌</h3>
        <div className="log-container">
          {mqttLogs.slice().reverse().map((log, index) => (
            <div key={index} className="mqtt-message">
              <div className="mqtt-header">
                <span className="mqtt-time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="mqtt-topic">Topic: {log.topic}</span>
              </div>
              <div className="mqtt-payload">
                <code>{JSON.stringify(log.payload, null, 2)}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CoAP 封包模擬 */}
      <div className="coap-panel">
        <h3>📦 CoAP 封包結構 (教育用途)</h3>
        <div className="coap-packet">
          <div className="packet-section">
            <strong>Header (Hex):</strong>
            <code className="hex-code">{coapPacket?.header || 'N/A'}</code>
          </div>
          <div className="packet-section">
            <strong>Payload:</strong>
            <code className="payload-code">{coapPacket?.payload || 'N/A'}</code>
          </div>
        </div>
        <div className="coap-info">
          <small>
            CoAP (Constrained Application Protocol) 是專為 IoT 設備設計的輕量級協議
          </small>
        </div>
      </div>
    </div>
  );
};

export default IoTDashboard;
