import React, { useState, useRef, useEffect } from 'react';

const GameTerminal = ({ state, context, onCommand }) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [requiredKey, setRequiredKey] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3); // 倒計時秒數
  const [unlockSequence, setUnlockSequence] = useState([]); // 解鎖序列
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0); // 當前序列進度
  const terminalRef = useRef(null);
  const timerRef = useRef(null);

  // 生成新的隨機按鍵
  const generateRandomKey = () => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setRequiredKey(randomKey);
    
    // 根據連續成功次數計算倒數時間：3秒 - (連勝次數 * 0.2秒)，最低1秒
    const baseTime = 3;
    const reduction = context.consecutiveSuccess * 0.2;
    const newTime = Math.max(1, baseTime - reduction);
    setTimeLeft(newTime);
  };

  // 生成解鎖序列（3個隨機方向鍵）
  const generateUnlockSequence = () => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const sequence = [];
    for (let i = 0; i < 3; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      sequence.push(randomKey);
    }
    setUnlockSequence(sequence);
    setCurrentSequenceIndex(0);
    setCommandHistory(prev => [
      ...prev,
      `🔐 解鎖序列: ${sequence.map(k => getKeyName(k)).join(' → ')}`,
    ]);
  };

  // 當狀態改變時，生成隨機要求的按鍵
  useEffect(() => {
    if (state === 'driving' || state === 'gateOpen') {
      generateRandomKey();
    } else if (state === 'gateClosed') {
      // 門關閉時生成解鎖序列
      generateUnlockSequence();
    } else if (state === 'startingEngine') {
      // 發動引擎時生成 QTE 序列（5個按鍵）
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const sequence = [];
      for (let i = 0; i < 5; i++) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        sequence.push(randomKey);
      }
      setUnlockSequence(sequence);
      setCurrentSequenceIndex(0);
      setCommandHistory(prev => [
        ...prev,
        `🎮 發動引擎 QTE: ${sequence.map(k => getKeyName(k)).join(' → ')}`,
      ]);
    } else if (state === 'idle' || state === 'inCar') {
      setRequiredKey(null);
      setTimeLeft(3);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [state]);

  // 倒計時計時器
  useEffect(() => {
    if ((state === 'driving' || state === 'gateOpen') && requiredKey) {
      // 清除舊的計時器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // 根據狀態計算初始時間
      let initialTime;
      if (state === 'gateOpen') {
        // 柵欄門固定 3 秒
        initialTime = 3;
      } else {
        // driving 狀態根據連續成功次數計算
        const baseTime = 3;
        const reduction = context.consecutiveSuccess * 0.2;
        initialTime = Math.max(1, baseTime - reduction);
      }
      setTimeLeft(initialTime);

      // 啟動新的計時器（使用 100ms 間隔以支持小數秒）
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 0.1;
          
          if (newTime <= 0) {
            // 時間到了
            // 使用 setTimeout 確保狀態更新不會干擾計時器
            setTimeout(() => {
              if (state === 'gateOpen') {
                // 柵欄門關閉
                onCommand('GATE_TIMEOUT');
                setCommandHistory(prev => [
                  ...prev,
                  '⏰ 時間到！柵欄門關閉了...',
                ]);
              } else if (state === 'driving') {
                // 撞牆扣血
                onCommand('DECREASE_DURABILITY');
                setCommandHistory(prev => [
                  ...prev,
                  '⏰ 時間到！反應太慢撞牆了...',
                ]);
              }
            }, 0);
            
            // 根據狀態重新計算時間
            if (state === 'gateOpen') {
              return 3; // 柵欄門固定 3 秒
            } else {
              const baseTime = 3;
              const reduction = context.consecutiveSuccess * 0.2;
              return Math.max(1, baseTime - reduction);
            }
          }
          
          return newTime;
        });
      }, 100);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      // 非倒計時狀態，清除計時器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(3);
    }
  }, [state, requiredKey]);

  // 獲取按鍵的顯示名稱
  const getKeyName = (key) => {
    const keyMap = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
    };
    return keyMap[key] || key;
  };

  useEffect(() => {
    // 自動捲動到底部
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [context.logs, commandHistory]);

  // 鍵盤方向鍵控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果正在輸入框中打字，不處理方向鍵
      if (document.activeElement.className === 'terminal-input') {
        return;
      }

      const key = e.key;
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      // 處理 F 鍵（進入車輛）
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        if (state === 'idle') {
          onCommand('ENTER_CAR');
          setCommandHistory(prev => [...prev, `⌨️ [F] 進入車輛`]);
        }
        return;
      }

      if (!arrowKeys.includes(key)) {
        return;
      }

      e.preventDefault();

      // inCar 狀態（啟動引擎）
      if (state === 'inCar') {
        if (key === 'ArrowUp') {
          onCommand('START_ENGINE_QTE');
          setCommandHistory(prev => [...prev, `⌨️ [${getKeyName(key)}] 開始發動引擎 QTE`]);
          return;
        } else if (key === 'ArrowDown') {
          onCommand('EXIT_CAR');
          setCommandHistory(prev => [...prev, `⌨️ [${getKeyName(key)}] 離開車輛`]);
          return;
        }
      }

      // 發動引擎 QTE 狀態
      if (state === 'startingEngine') {
        const expectedKey = unlockSequence[currentSequenceIndex];
        
        if (key === expectedKey) {
          // 按對了
          const newIndex = currentSequenceIndex + 1;
          setCurrentSequenceIndex(newIndex);
          setCommandHistory(prev => [
            ...prev,
            `✅ [${getKeyName(key)}] 正確！(${newIndex}/${unlockSequence.length})`,
          ]);
          
          // 檢查是否完成整個序列
          if (newIndex >= unlockSequence.length) {
            onCommand('QTE_SUCCESS');
            setCommandHistory(prev => [...prev, '🎉 引擎發動成功！']);
          }
        } else {
          // 按錯了，QTE 失敗
          onCommand('QTE_FAILED');
          setCommandHistory(prev => [
            ...prev,
            `❌ [${getKeyName(key)}] 錯誤！應該按 ${getKeyName(expectedKey)}`,
            `💀 QTE 失敗！引擎熄火...`,
          ]);
          setCurrentSequenceIndex(0);
          setUnlockSequence([]);
        }
        return;
      }

      // 需要隨機按鍵的狀態
      if (state === 'driving' || state === 'gateOpen') {
        if (key === requiredKey) {
          // 按對了
          if (state === 'driving') {
            onCommand('MOVE_FORWARD');
            setCommandHistory(prev => [...prev, `✅ [${getKeyName(key)}] 正確！向前行駛`]);
          } else if (state === 'gateOpen') {
            onCommand('DRIVE_THROUGH');
            setCommandHistory(prev => [...prev, `✅ [${getKeyName(key)}] 正確！通過柵欄`]);
          }
          // 生成下一個隨機按鍵
          generateRandomKey();
        } else {
          // 按錯了
          onCommand('DECREASE_DURABILITY');
          setCommandHistory(prev => [
            ...prev,
            `❌ [${getKeyName(key)}] 錯誤！應該按 ${getKeyName(requiredKey)}`,
          ]);
          // 生成新的隨機按鍵
          generateRandomKey();
        }
      }

      // 柵欄關閉後重新解鎖（需要完成序列）
      if (state === 'gateClosed') {
        const expectedKey = unlockSequence[currentSequenceIndex];
        
        if (key === expectedKey) {
          // 按對了
          const newIndex = currentSequenceIndex + 1;
          setCurrentSequenceIndex(newIndex);
          setCommandHistory(prev => [
            ...prev,
            `✅ [${getKeyName(key)}] 正確！(${newIndex}/${unlockSequence.length})`,
          ]);
          
          // 檢查是否完成整個序列
          if (newIndex >= unlockSequence.length) {
            onCommand('REOPEN_GATE');
            setCommandHistory(prev => [...prev, '🎉 解鎖成功！重新啟動感測器...']);
          }
        } else {
          // 按錯了，重置序列
          setCurrentSequenceIndex(0);
          setCommandHistory(prev => [
            ...prev,
            `❌ [${getKeyName(key)}] 錯誤！應該按 ${getKeyName(expectedKey)}`,
            `🔄 序列重置，請重新輸入: ${unlockSequence.map(k => getKeyName(k)).join(' → ')}`,
          ]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, requiredKey, unlockSequence, currentSequenceIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const command = input.toLowerCase().trim();
    setCommandHistory(prev => [...prev, `> ${input}`]);
    
    // 解析命令
    switch (command) {
      case 'enter car':
      case 'enter':
        onCommand('ENTER_CAR');
        break;
      case 'start':
      case 'start engine':
      case 'drive':
        onCommand('START_DRIVING');
        break;
      case 'forward':
      case 'move':
      case 'go':
        onCommand('MOVE_FORWARD');
        break;
      case 'through':
      case 'drive through':
        onCommand('DRIVE_THROUGH');
        break;
      case 'stop':
        onCommand('STOP');
        break;
      case 'exit':
      case 'exit car':
        onCommand('EXIT_CAR');
        break;
      case 'help':
        setCommandHistory(prev => [
          ...prev,
          '可用命令:',
          '  enter car - 進入車輛',
          '  start - 啟動引擎',
          '  forward - 向前行駛',
          '  through - 通過柵欄',
          '  stop - 停車',
          '  exit car - 離開車輛',
          '  help - 顯示此說明',
          '',
          '⌨️ 鍵盤控制:',
          '  ↑ - 進入車輛/啟動引擎',
          '  ↓ - 離開車輛',
          '  行駛時: 根據提示按下正確的方向鍵！',
          '  ⏰ 每個按鍵必須在 3 秒內按下',
          '  ❌ 按錯或超時會撞牆，耐久度 -10',
          '  🚧 開門後 3 秒內未通過，門會關閉',
          '  💀 耐久度歸零車輛損壞',
        ]);
        break;
      default:
        setCommandHistory(prev => [
          ...prev,
          `未知命令: ${command}. 輸入 'help' 查看可用命令`,
        ]);
    }

    setInput('');
  };

  // 根據狀態生成敘事文字
  const getNarrative = () => {
    const durabilityColor = context.durability > 50 ? '#00ff00' : context.durability > 20 ? '#ffff00' : '#ff0000';
    const durabilityBar = '█'.repeat(Math.floor(context.durability / 10)) + '░'.repeat(10 - Math.floor(context.durability / 10));
    const timeColor = timeLeft <= 1 ? '#ff0000' : timeLeft <= 2 ? '#ffff00' : '#00ff00';
    
    switch (state) {
      case 'idle':
        return '你站在停車場入口。前方有一輛車和一道柵欄。按 F 鍵進入車輛。';
      case 'inCar':
        return (
          <div>
            <div>你坐在車內。柵欄距離 {(context.distance / 100).toFixed(1)} 米。</div>
            <div style={{ color: durabilityColor }}>
              耐久度: {durabilityBar} {context.durability}%
            </div>
            <div>按 ↑ 鍵開始發動引擎 QTE。</div>
          </div>
        );
      case 'startingEngine':
        return (
          <div>
            <div style={{ color: '#ffff00' }}>🎮 正在發動引擎...</div>
            <div style={{ color: durabilityColor }}>
              耐久度: {durabilityBar} {context.durability}%
            </div>
            <div style={{ color: '#ffff00', fontSize: '1.2rem', marginTop: '10px' }}>
              🔐 按鍵序列（共 {unlockSequence.length} 個）:
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
              {unlockSequence.map((k, i) => (
                <div key={i} style={{
                  padding: '10px 15px',
                  background: i < currentSequenceIndex ? '#00ff0033' : '#ffffff22',
                  border: `2px solid ${i < currentSequenceIndex ? '#00ff00' : '#ffffff'}`,
                  borderRadius: '5px',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: i < currentSequenceIndex ? '#00ff00' : '#ffffff',
                  textDecoration: i < currentSequenceIndex ? 'line-through' : 'none',
                  position: 'relative',
                }}>
                  {getKeyName(k)}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem',
                    color: '#aaaaaa'
                  }}>
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color: '#aaaaaa', fontSize: '0.9rem', marginTop: '10px' }}>
              進度: {currentSequenceIndex}/{unlockSequence.length}
            </div>
          </div>
        );
      case 'driving':
        return (
          <div>
            <div>引擎運轉中。柵欄距離 {(context.distance / 100).toFixed(2)} 米。</div>
            <div style={{ color: durabilityColor }}>
              耐久度: {durabilityBar} {context.durability}%
            </div>
            <div style={{ color: '#00ffff', fontSize: '1rem', marginTop: '5px' }}>
              🔥 連勝: {context.consecutiveSuccess} 次
            </div>
            <div style={{ color: '#ffff00', fontSize: '1.3rem', fontWeight: 'bold' }}>
              ⚡ 快速按下 {getKeyName(requiredKey)} 鍵前進！
            </div>
            <div style={{ color: timeColor, fontSize: '1.5rem', fontWeight: 'bold' }}>
              ⏰ 剩餘時間: {timeLeft.toFixed(1)} 秒
            </div>
            {context.consecutiveSuccess > 0 && (
              <div style={{ color: '#ff6600', fontSize: '0.9rem', marginTop: '5px' }}>
                ⚠️ 難度提升！反應時間減少 {(context.consecutiveSuccess * 0.2).toFixed(1)} 秒
              </div>
            )}
          </div>
        );
      case 'detected':
        return '🚨 感測器偵測到你的車輛！系統正在處理...';
      case 'gateOpening':
        return '🚧 柵欄正在開啟，請稍候...';
      case 'gateOpen':
        return (
          <div>
            <div>✅ 柵欄已開啟！</div>
            <div style={{ color: durabilityColor }}>
              耐久度: {durabilityBar} {context.durability}%
            </div>
            <div style={{ color: '#ffff00', fontSize: '1.3rem', fontWeight: 'bold' }}>
              ⚡ 按下 {getKeyName(requiredKey)} 鍵通過柵欄！
            </div>
            <div style={{ color: timeColor, fontSize: '1.5rem', fontWeight: 'bold' }}>
              ⏰ 剩餘時間: {timeLeft.toFixed(1)} 秒（固定 3 秒）
            </div>
          </div>
        );
      case 'gateClosed':
        return (
          <div>
            <div style={{ color: '#ff0000' }}>🚧 柵欄門已關閉！</div>
            <div style={{ color: durabilityColor }}>
              耐久度: {durabilityBar} {context.durability}%
            </div>
            <div style={{ color: '#ffff00', fontSize: '1.2rem', marginTop: '10px' }}>
              🔐 解鎖序列（共 {unlockSequence.length} 個按鍵）:
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
              {unlockSequence.map((k, i) => (
                <div key={i} style={{
                  padding: '10px 15px',
                  background: i < currentSequenceIndex ? '#00ff0033' : '#ffffff22',
                  border: `2px solid ${i < currentSequenceIndex ? '#00ff00' : '#ffffff'}`,
                  borderRadius: '5px',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: i < currentSequenceIndex ? '#00ff00' : '#ffffff',
                  textDecoration: i < currentSequenceIndex ? 'line-through' : 'none',
                  position: 'relative',
                }}>
                  {getKeyName(k)}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    fontSize: '0.7rem',
                    color: '#aaaaaa'
                  }}>
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color: '#aaaaaa', fontSize: '0.9rem', marginTop: '10px' }}>
              進度: {currentSequenceIndex}/{unlockSequence.length}
            </div>
          </div>
        );
      case 'parked':
        return (
          <div>
            <div>🎉 成功停車！</div>
            <div style={{ color: durabilityColor }}>
              最終耐久度: {context.durability}%
            </div>
            <div>你完成了這個 IoT 數位雙生模擬遊戲。</div>
          </div>
        );
      case 'broken':
        return (
          <div>
            <div style={{ color: '#ff0000' }}>💥 車輛完全損壞！</div>
            <div>耐久度: {durabilityBar} 0%</div>
            <div>遊戲結束。</div>
          </div>
        );
      default:
        return '系統狀態異常...';
    }
  };

  return (
    <div className="game-terminal">
      <div className="terminal-header">
        <span className="terminal-title">🎮 停車場模擬終端</span>
        <span className="terminal-state">狀態: {state.toUpperCase()}</span>
      </div>
      
      <div className="terminal-output" ref={terminalRef}>
        <div className="narrative-text">
          {getNarrative()}
        </div>
        
        <div className="separator">--- 遊戲日誌 ---</div>
        
        {context.logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-time">
              [{new Date(log.time).toLocaleTimeString()}]
            </span>{' '}
            <span className="log-message">{log.message}</span>
          </div>
        ))}
        
        {commandHistory.map((cmd, index) => (
          <div key={`cmd-${index}`} className="command-output">
            {cmd}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="terminal-input-form">
        <span className="prompt">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="terminal-input"
          placeholder="輸入命令 (help 查看說明)"
          autoFocus
        />
      </form>
    </div>
  );
};

export default GameTerminal;
