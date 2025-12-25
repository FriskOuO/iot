import { createMachine } from 'xstate';

export const parkingLotMachine = createMachine({
  id: 'parkingLot',
  initial: 'idle',
  context: {
    distance: 300, // 初始距離 300cm (3米)
    barrierOpen: false,
    carSpeed: 0,
    position: 0, // 車輛位置（cm）
    logs: [],
    durability: 100, // 汽車耐久度
    requiredKey: null, // 當前要求的按鍵
    consecutiveSuccess: 0, // 連續成功次數
  },
  states: {
    idle: {
      on: {
        ENTER_CAR: {
          target: 'inCar',
          actions: 'logAction',
        },
      },
    },
    inCar: {
      entry: 'updateContext',
      on: {
        START_ENGINE_QTE: {
          target: 'startingEngine',
          actions: 'beginEngineQTE',
        },
        EXIT_CAR: {
          target: 'idle',
          actions: 'logAction',
        },
      },
    },
    startingEngine: {
      on: {
        QTE_SUCCESS: {
          target: 'driving',
          actions: 'startEngine',
        },
        QTE_FAILED: {
          target: 'inCar',
          actions: 'qteFailed',
        },
        EXIT_CAR: {
          target: 'idle',
          actions: 'logAction',
        },
      },
    },
    driving: {
      entry: 'startDriving',
      on: {
        MOVE_FORWARD: {
          target: 'driving',
          actions: 'moveForward',
          guard: 'canMoveForward',
        },
        SENSOR_DETECTED: {
          target: 'detected',
          actions: 'sensorDetected',
          guard: 'isCloseEnough',
        },
        STOP: {
          target: 'inCar',
          actions: 'stopCar',
        },
      },
    },
    detected: {
      entry: 'triggerSensor',
      after: {
        1000: {
          target: 'gateOpening',
          actions: 'sendMQTTCommand',
        },
      },
    },
    gateOpening: {
      entry: 'openBarrier',
      after: {
        2000: {
          target: 'gateOpen',
        },
      },
    },
    gateOpen: {
      on: {
        DRIVE_THROUGH: {
          target: 'parked',
          actions: 'driveThrough',
        },
        GATE_TIMEOUT: {
          target: 'gateClosed',
          actions: 'closeGate',
        },
        DECREASE_DURABILITY: {
          actions: 'decreaseDurability',
        },
      },
    },
    gateClosed: {
      on: {
        REOPEN_GATE: {
          target: 'detected',
          actions: 'reopenAttempt',
        },
      },
    },
    parked: {
      type: 'final',
      entry: 'parkingComplete',
    },
    broken: {
      type: 'final',
      entry: 'carBroken',
    },
  },
});

// Guards (條件檢查)
export const guards = {
  canMoveForward: (context) => {
    return context.distance > 5; // 還有距離可以前進
  },
  isCloseEnough: (context) => {
    return context.distance < 50; // 小於 50cm 時觸發感測器
  },
};

// Actions (狀態轉換時的動作)
export const actions = {
  logAction: (context, event) => {
    console.log(`Action: ${event.type}`);
  },
  updateContext: (context) => {
    return {
      ...context,
      logs: [...context.logs, { time: Date.now(), message: '你坐進了車內' }],
    };
  },
  startEngine: (context) => {
    return {
      ...context,
      carSpeed: 0,
      logs: [...context.logs, { time: Date.now(), message: '引擎啟動！' }],
    };
  },
  startDriving: (context) => {
    return {
      ...context,
      carSpeed: 10,
      logs: [...context.logs, { time: Date.now(), message: '開始行駛...' }],
    };
  },
  moveForward: (context) => {
    const newPosition = context.position + 20; // 每次前進 20cm
    const newDistance = 300 - newPosition; // 計算與柵欄的距離
    const newSuccess = context.consecutiveSuccess + 1; // 增加連續成功次數
    return {
      ...context,
      position: newPosition,
      distance: Math.max(0, newDistance),
      consecutiveSuccess: newSuccess,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: `向前行駛... 距離柵欄還有 ${Math.max(0, newDistance)} cm (連勝: ${newSuccess})`,
        },
      ],
    };
  },
  sensorDetected: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🚨 超聲波感測器偵測到車輛！',
        },
      ],
    };
  },
  triggerSensor: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '📡 HC-SR04 感測器: Trigger 訊號發送',
        },
        {
          time: Date.now() + 100,
          message: `📡 Echo 返回: ${context.distance} cm`,
        },
      ],
    };
  },
  sendMQTTCommand: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '📨 MQTT Publish: Topic: parking/gate/command | Payload: {"action":"open"}',
        },
      ],
    };
  },
  openBarrier: (context) => {
    return {
      ...context,
      barrierOpen: true,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🚧 柵欄正在開啟...',
        },
      ],
    };
  },
  driveThrough: (context) => {
    return {
      ...context,
      position: 350,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🚗 車輛通過柵欄',
        },
      ],
    };
  },
  parkingComplete: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '✅ 成功停車！遊戲結束。',
        },
      ],
    };
  },
  stopCar: (context) => {
    return {
      ...context,
      carSpeed: 0,
      logs: [...context.logs, { time: Date.now(), message: '車輛停止' }],
    };
  },
  carBroken: (context) => {
    return {
      ...context,
      carSpeed: 0,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '💥 車輛耐久度歸零！車子已損壞，遊戲結束。',
        },
      ],
    };
  },
  decreaseDurability: (context) => {
    const newDurability = Math.max(0, context.durability - 10);
    return {
      ...context,
      durability: newDurability,
      consecutiveSuccess: 0, // 失敗時重置連續成功次數
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: `💥 撞到牆壁！耐久度 -10 (剩餘: ${newDurability}) | 連勝重置`,
        },
      ],
    };
  },
  closeGate: (context) => {
    return {
      ...context,
      barrierOpen: false,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🚧 時間到！柵欄門關閉了...',
        },
      ],
    };
  },
  reopenAttempt: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🔄 嘗試重新解鎖柵欄...',
        },
      ],
    };
  },
  beginEngineQTE: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '🎮 開始發動引擎 QTE！按照提示輸入按鍵...',
        },
      ],
    };
  },
  qteFailed: (context) => {
    return {
      ...context,
      logs: [
        ...context.logs,
        {
          time: Date.now(),
          message: '❌ QTE 失敗！引擎熄火了，請重試...',
        },
      ],
    };
  },
};
