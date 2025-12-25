import React, { useState, useEffect, useCallback } from 'react';
import './GridGame.css';

/**
 * 2D 文字網格遊戲引擎
 * 使用漢字作為遊戲元素的視覺表現
 */

// 遊戲地圖配置 (20x20 網格)
const GRID_SIZE = 20;

// 字符定義
const CHARS = {
  EMPTY: '　', // 全形空格
  WALL: '牆',
  PERSON: '人',
  CAR: '車',
  BARRIER: '桿',
  BARRIER_OPEN: '開',
  PARKING_SPOT: '停',
  SENSOR: '測'
};

// 初始化地圖
const createInitialMap = () => {
  const map = Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(CHARS.EMPTY)
  );

  // 繪製外牆
  for (let i = 0; i < GRID_SIZE; i++) {
    map[0][i] = CHARS.WALL; // 上牆
    map[GRID_SIZE - 1][i] = CHARS.WALL; // 下牆
    map[i][0] = CHARS.WALL; // 左牆
    map[i][GRID_SIZE - 1] = CHARS.WALL; // 右牆
  }

  // 繪製停車格 (右下角區域)
  for (let i = 14; i < 18; i++) {
    for (let j = 14; j < 18; j++) {
      if (map[i][j] !== CHARS.WALL) {
        map[i][j] = CHARS.PARKING_SPOT;
      }
    }
  }

  // 放置柵欄 (中間位置)
  map[10][10] = CHARS.BARRIER;
  
  // 放置感測器 (柵欄旁邊)
  map[10][9] = CHARS.SENSOR;

  return map;
};

const GridGame = ({ state, context, onCommand, onDistanceChange }) => {
  const [map, setMap] = useState(createInitialMap());
  const [playerPos, setPlayerPos] = useState({ x: 2, y: 2 });
  const [carPos, setCarPos] = useState({ x: 4, y: 4 });
  const [inCar, setInCar] = useState(false);

  // 計算網格距離（曼哈頓距離）
  const calculateDistance = useCallback((pos1, pos2) => {
    const dx = Math.abs(pos2.x - pos1.x);
    const dy = Math.abs(pos2.y - pos1.y);
    // 模擬歐幾里得距離並轉換為公分 (假設每格 = 50cm)
    const gridDistance = Math.sqrt(dx * dx + dy * dy);
    return gridDistance * 50; // 轉換為公分
  }, []);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentPos = inCar ? carPos : playerPos;
      const setCurrentPos = inCar ? setCarPos : setPlayerPos;
      let newX = currentPos.x;
      let newY = currentPos.y;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          newX = Math.max(1, currentPos.x - 1);
          break;
        case 's':
        case 'arrowdown':
          newX = Math.min(GRID_SIZE - 2, currentPos.x + 1);
          break;
        case 'a':
        case 'arrowleft':
          newY = Math.max(1, currentPos.y - 1);
          break;
        case 'd':
        case 'arrowright':
          newY = Math.min(GRID_SIZE - 2, currentPos.y + 1);
          break;
        case 'f':
          // 進入/離開車輛
          if (!inCar) {
            const distToCar = calculateDistance(playerPos, carPos);
            if (distToCar < 100) { // 小於 1 米
              setInCar(true);
              onCommand('ENTER_CAR');
            }
          }
          return;
        case 'enter':
          if (inCar && state === 'inCar') {
            onCommand('START_ENGINE_QTE');
          }
          return;
        default:
          return;
      }

      // 檢查碰撞
      if (map[newX][newY] !== CHARS.WALL) {
        setCurrentPos({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, carPos, inCar, map, state, onCommand, calculateDistance]);

  // 更新距離到感測器
  useEffect(() => {
    const barrierPos = { x: 10, y: 10 };
    const vehiclePos = inCar ? carPos : carPos; // 總是監測車輛位置
    const distance = calculateDistance(vehiclePos, barrierPos);
    
    if (onDistanceChange) {
      onDistanceChange(distance);
    }
  }, [carPos, inCar, onDistanceChange, calculateDistance]);

  // 更新地圖顯示
  useEffect(() => {
    const newMap = createInitialMap();

    // 繪製柵欄狀態
    if (context.barrierOpen) {
      newMap[10][10] = CHARS.BARRIER_OPEN;
    } else {
      newMap[10][10] = CHARS.BARRIER;
    }

    // 繪製車輛
    if (newMap[carPos.x][carPos.y] !== CHARS.WALL) {
      newMap[carPos.x][carPos.y] = CHARS.CAR;
    }

    // 繪製玩家 (如果不在車內)
    if (!inCar && newMap[playerPos.x][playerPos.y] !== CHARS.WALL) {
      newMap[playerPos.x][playerPos.y] = CHARS.PERSON;
    }

    setMap(newMap);
  }, [playerPos, carPos, inCar, context.barrierOpen]);

  // 渲染網格
  const renderGrid = () => {
    return map.map((row, i) => (
      <div key={i} className="grid-row">
        {row.map((cell, j) => {
          let className = 'grid-cell';
          
          // 添加特殊樣式
          if (cell === CHARS.WALL) className += ' wall';
          else if (cell === CHARS.PERSON) className += ' player';
          else if (cell === CHARS.CAR) className += ' car';
          else if (cell === CHARS.BARRIER) className += ' barrier-closed';
          else if (cell === CHARS.BARRIER_OPEN) className += ' barrier-open';
          else if (cell === CHARS.PARKING_SPOT) className += ' parking';
          else if (cell === CHARS.SENSOR) className += ' sensor';

          return (
            <div key={j} className={className}>
              {cell}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="grid-game-container">
      {/* 遊戲標題 */}
      <div className="game-title">
        <h2>🚗 智慧停車場 - 文字遊戲版</h2>
        <div className="game-status">
          狀態: <span className="status-text">{state}</span> | 
          耐久度: <span className="durability">{context.durability}</span> |
          {inCar ? ' 駕駛模式 🚗' : ' 步行模式 🚶'}
        </div>
      </div>

      {/* 遊戲網格 */}
      <div className="grid-world">
        {renderGrid()}
      </div>

      {/* 控制提示 */}
      <div className="control-hints">
        <div className="hint-section">
          <strong>控制鍵:</strong> WASD / 方向鍵 - 移動 | F - 進入車輛 | Enter - 啟動引擎
        </div>
        <div className="hint-section">
          <strong>圖例:</strong>
          <span className="legend-item wall">牆</span> = 牆壁 |
          <span className="legend-item player">人</span> = 玩家 |
          <span className="legend-item car">車</span> = 車輛 |
          <span className="legend-item barrier-closed">桿</span> = 柵欄 |
          <span className="legend-item barrier-open">開</span> = 開啟 |
          <span className="legend-item parking">停</span> = 車位
        </div>
      </div>

      {/* 距離指示器 */}
      <div className="distance-indicator">
        <div className="indicator-label">📡 HC-SR04 感測器讀數</div>
        <div className="indicator-value">
          {calculateDistance(carPos, { x: 10, y: 10 }).toFixed(1)} cm
        </div>
        {calculateDistance(carPos, { x: 10, y: 10 }) < 150 && (
          <div className="indicator-alert">⚠️ 進入偵測範圍！</div>
        )}
      </div>
    </div>
  );
};

export default GridGame;
