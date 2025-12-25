import React, { useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { parkingAdventureMachine, services } from '../parkingAdventureMachine';
import { useVirtualHardware } from '../hooks/useVirtualHardware';

/**
 * 文字冒險遊戲 - 智慧停車場模擬器
 * 
 * 分屏設計：
 * - 左側：敘事日誌 + 互動按鈕
 * - 右側：IoT 儀表板（感測器數據、協議日誌）
 */

const TextAdventureGame = () => {
  const [state, send] = useMachine(parkingAdventureMachine, {
    services
  });

  const { context } = state;
  const logEndRef = useRef(null);

  // 虛擬硬體模擬
  const isAnimating = state.matches('sensing_vehicle');
  const hardware = useVirtualHardware(
    context.distance,
    isAnimating
  );

  // 自動滾動到日誌底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [context.narrativeLog]);

  // 渲染敘事日誌條目
  const renderLogEntry = (entry, index) => {
    const colorClass = {
      system: 'text-green-400',
      narrator: 'text-cyan-300',
      player: 'text-yellow-300'
    }[entry.type] || 'text-gray-300';

    const prefix = {
      system: '[系統]',
      narrator: '',
      player: ''
    }[entry.type] || '';

    return (
      <div key={index} className={`mb-2 ${colorClass} font-mono text-sm leading-relaxed`}>
        {prefix && <span className="text-green-500 font-bold">{prefix} </span>}
        {entry.text}
      </div>
    );
  };

  // 渲染動作按鈕
  const renderActionButtons = () => {
    const buttons = [];

    if (state.matches('entrance_idle')) {
      buttons.push(
        <button
          key="approach"
          onClick={() => send({ type: 'APPROACH' })}
          className="action-button"
        >
          🎫 按下票券按鈕
        </button>
      );
    }

    if (state.matches('vehicle_detected')) {
      buttons.push(
        <button
          key="ticket"
          onClick={() => send({ type: 'REQUEST_TICKET' })}
          className="action-button"
        >
          🎟️ 取票
        </button>
      );
    }

    if (state.matches('ticket_issued')) {
      buttons.push(
        <button
          key="open"
          onClick={() => send({ type: 'OPEN_GATE' })}
          className="action-button"
        >
          🚧 感應票券開啟柵欄
        </button>
      );
    }

    if (state.matches('gate_open')) {
      buttons.push(
        <button
          key="drive"
          onClick={() => send({ type: 'DRIVE_IN' })}
          className="action-button"
        >
          🚗 駛入停車場
        </button>
      );
    }

    if (state.matches('parked')) {
      buttons.push(
        <button
          key="pay"
          onClick={() => send({ type: 'PAY_AND_LEAVE' })}
          className="action-button"
        >
          💳 繳費離開
        </button>
      );
    }

    if (state.matches('exit_gate')) {
      buttons.push(
        <button
          key="exit"
          onClick={() => send({ type: 'EXIT' })}
          className="action-button"
        >
          🚪 駛離出口
        </button>
      );
    }

    if (state.matches('game_over')) {
      buttons.push(
        <button
          key="restart"
          onClick={() => send({ type: 'RESTART' })}
          className="action-button-primary"
        >
          🔄 重新開始
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-4 px-6 shadow-lg">
        <h1 className="text-3xl font-bold">🚗 智慧停車場 - 文字冒險遊戲</h1>
        <p className="text-sm text-gray-300 mt-1">
          IoT Digital Twin Simulator | State: <span className="text-yellow-300 font-semibold">{state.value}</span>
        </p>
      </header>

      {/* Main Content - Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-[calc(100vh-100px)]">
        
        {/* Left Panel - Game UI */}
        <div className="bg-black border-2 border-green-500 rounded-lg p-4 flex flex-col shadow-xl overflow-hidden">
          <h2 className="text-xl font-bold text-green-400 mb-4 border-b border-green-500 pb-2">
            📖 互動式敘事日誌
          </h2>
          
          {/* Narrative Log */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-1 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-800">
            {context.narrativeLog.map((entry, i) => renderLogEntry(entry, i))}
            <div ref={logEndRef} />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-green-500 pt-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">🎮 可用操作：</h3>
            <div className="flex flex-wrap gap-2">
              {renderActionButtons()}
            </div>
          </div>
        </div>

        {/* Right Panel - IoT Dashboard */}
        <div className="bg-gray-950 border-2 border-cyan-500 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto shadow-xl scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-gray-800">
          <h2 className="text-xl font-bold text-cyan-400 border-b border-cyan-500 pb-2">
            🔧 IoT 工程儀表板
          </h2>

          {/* HC-SR04 Sensor */}
          <div className="dashboard-panel">
            <h3 className="panel-title">📡 HC-SR04 超聲波感測器</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="sensor-data">
                <span className="text-gray-400">距離:</span>
                <span className="text-green-400 text-2xl font-bold ml-2">
                  {hardware.distance.toFixed(2)} cm
                </span>
              </div>
              <div className="sensor-data">
                <span className="text-gray-400">時間:</span>
                <span className="text-yellow-400 text-xl ml-2">
                  {hardware.duration.toFixed(2)} µs
                </span>
              </div>
              <div className="sensor-data">
                <span className="text-gray-400">溫度:</span>
                <span className="text-orange-400 ml-2">
                  {hardware.temperature.toFixed(1)} °C
                </span>
              </div>
              <div className="sensor-data">
                <span className="text-gray-400">音速:</span>
                <span className="text-cyan-400 ml-2">
                  {hardware.speedOfSound.toFixed(2)} m/s
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              公式: Duration (µs) = Distance (cm) × 2 / (SpeedOfSound × 0.01)
            </div>
          </div>

          {/* MQTT Logs */}
          <div className="dashboard-panel">
            <h3 className="panel-title">📡 MQTT 訊息日誌</h3>
            <div className="log-container">
              {context.mqttLogs.length === 0 ? (
                <div className="text-gray-600 text-sm italic">等待 MQTT 事件...</div>
              ) : (
                context.mqttLogs.map((log, i) => (
                  <div key={i} className="log-entry">
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-cyan-400 font-semibold">
                      Topic: {log.topic}
                    </div>
                    <div className="text-green-400 text-xs">
                      {JSON.stringify(log.payload)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CoAP Packets */}
          <div className="dashboard-panel">
            <h3 className="panel-title">📦 CoAP 封包 (Hex)</h3>
            <div className="log-container">
              {context.coapPackets.length === 0 ? (
                <div className="text-gray-600 text-sm italic">等待 CoAP 封包...</div>
              ) : (
                context.coapPackets.map((packet, i) => (
                  <div key={i} className="log-entry">
                    <div className="text-xs text-gray-500">
                      {new Date(packet.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-purple-400 font-mono text-xs">
                      {packet.hex}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {packet.decoded}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SQL Records */}
          <div className="dashboard-panel">
            <h3 className="panel-title">🗄️ SQL 停車記錄表</h3>
            {context.sqlRecords.length === 0 ? (
              <div className="text-gray-600 text-sm italic">無記錄</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-yellow-400 border-b border-gray-700">
                      <th className="py-2 px-2 text-left">ID</th>
                      <th className="py-2 px-2 text-left">票券</th>
                      <th className="py-2 px-2 text-left">車輛</th>
                      <th className="py-2 px-2 text-left">進場時間</th>
                      <th className="py-2 px-2 text-right">費用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {context.sqlRecords.map((record) => (
                      <tr key={record.id} className="border-b border-gray-800 hover:bg-gray-900">
                        <td className="py-2 px-2">{record.id}</td>
                        <td className="py-2 px-2 text-cyan-400">{record.ticketId.substring(0, 15)}...</td>
                        <td className="py-2 px-2 text-green-400">{record.vehicleId}</td>
                        <td className="py-2 px-2 text-gray-400">{record.entryTime}</td>
                        <td className="py-2 px-2 text-right text-yellow-400">
                          NT$ {record.fee}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Real-time Hex Display */}
          <div className="dashboard-panel">
            <h3 className="panel-title">🔢 即時 CoAP Hex Stream</h3>
            <div className="bg-black p-3 rounded border border-gray-700 font-mono text-xs text-purple-400 break-all">
              {hardware.rawHex}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .action-button {
          @apply bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded 
                 transition duration-200 transform hover:scale-105 shadow-lg;
        }

        .action-button-primary {
          @apply bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                 text-white font-bold py-3 px-6 rounded-lg transition duration-200 
                 transform hover:scale-105 shadow-xl text-lg;
        }

        .dashboard-panel {
          @apply bg-gray-900 border border-gray-700 rounded-lg p-4;
        }

        .panel-title {
          @apply text-cyan-400 font-bold mb-3 text-sm border-b border-gray-700 pb-2;
        }

        .sensor-data {
          @apply bg-black p-2 rounded border border-gray-800;
        }

        .log-container {
          @apply space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900;
        }

        .log-entry {
          @apply bg-black p-2 rounded border border-gray-800;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thumb-green-500::-webkit-scrollbar-thumb {
          background-color: #10b981;
          border-radius: 4px;
        }

        .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background-color: #1f2937;
        }
      `}</style>
    </div>
  );
};

export default TextAdventureGame;
