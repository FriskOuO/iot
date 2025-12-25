import { createMachine, assign } from 'xstate';

/**
 * XState v5 狀態機 - 帶 QTE 機制的停車場冒險遊戲
 * 
 * 特色：引擎啟動的方向鍵序列挑戰（Quick Time Event）
 * 更新：主角駕駛教學與耐久度機制
 */

// 生成隨機方向鍵序列
const generateRandomSequence = (length = 4) => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  return Array.from({ length }, () => keys[Math.floor(Math.random() * keys.length)]);
};

// 生成單個隨機方向鍵
const generateRandomKey = () => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  return keys[Math.floor(Math.random() * keys.length)];
};

export const qteGameMachine = createMachine({
  id: 'qteGame',
  initial: 'idle',
  
  context: {
    narrativeLog: [
      { type: 'narrator', text: '🌅 你站在一個空曠的停車場前。陽光灑落在瀝青地面上。' },
      { type: 'narrator', text: '🚗 眼前是一輛銀色的轎車，車門微微開啟著...' }
    ],
    targetSequence: generateRandomSequence(4), // 目標按鍵序列 (用於啟動引擎)
    currentSequence: [], // 當前玩家輸入的序列
    currentKey: null, // 當前駕駛 QTE 目標按鍵
    qteTimeLeft: 3, // QTE 剩餘時間（秒）
    qteAttempts: 0, // QTE 嘗試次數
    distance: 1000, // 距離感測器（cm）
    mqttLogs: [],
    coapPackets: [],
    engineRunning: false,
    
    // 新增駕駛機制變數
    carDurability: 100, // 車輛耐久度
    consecutiveErrors: 0, // 連續錯誤次數
    consecutiveSuccesses: 0, // 連續成功次數
    drivingQteTimeLimit: 3000, // 駕駛 QTE 時間限制 (ms)
  },

  states: {
    // 狀態 1: 閒置（遊戲開始）
    idle: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: '💡 提示：點擊 [進入車輛] 開始你的冒險。' }
        ]
      }),
      
      on: {
        ENTER_CAR: {
          target: 'inCar',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你打開車門，坐進駕駛座。' },
              { type: 'narrator', text: '🪑 你坐在駕駛座上，看著複雜的儀表板，心中一陣慌亂。你根本不會開車。' },
              { type: 'system', text: '🤖 系統啟動中... 偵測到駕駛員無駕駛技能。' },
              { type: 'system', text: '🤖 正在載入「新手駕駛輔助教學模組」...' }
            ]
          })
        }
      }
    },

    // 狀態 2: 在車內 (準備教學)
    inCar: {
      after: {
        3000: {
          target: 'tutorialIntro',
        }
      }
    },

    // 狀態 2.5: 教學介紹
    tutorialIntro: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: '🤖 系統：請跟隨螢幕指示操作方向盤 (方向鍵)。' },
          { type: 'system', text: '⚠️ 警告：操作失誤將損耗車輛耐久度。連續失誤 3 次將導致引擎熄火。' },
          { type: 'system', text: '🏁 目標：安全駕駛並將車輛停入車庫。' }
        ]
      }),
      after: {
        3000: {
          target: 'drivingTutorial',
          actions: assign({
            engineRunning: true,
            currentKey: generateRandomKey(),
            drivingQteTimeLimit: 3000,
            consecutiveSuccesses: 0,
            consecutiveErrors: 0
          })
        }
      }
    },

    // 狀態 3: 駕駛教學 (核心玩法)
    drivingTutorial: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: `🎮 請按下: ${getArrowSymbol(context.currentKey)}` }
        ]
      }),

      on: {
        KEY_PRESS: {
          actions: assign({
            // 判斷邏輯在 guard 中處理，這裡只處理結果
            consecutiveSuccesses: ({ context, event }) => {
              return event.key === context.currentKey ? context.consecutiveSuccesses + 1 : 0;
            },
            consecutiveErrors: ({ context, event }) => {
              return event.key !== context.currentKey ? context.consecutiveErrors + 1 : 0;
            },
            carDurability: ({ context, event }) => {
              return event.key !== context.currentKey ? Math.max(0, context.carDurability - 10) : context.carDurability;
            },
            drivingQteTimeLimit: ({ context, event }) => {
              if (event.key === context.currentKey) {
                // 成功：時間縮短，最低 500ms
                return Math.max(500, 3000 - (context.consecutiveSuccesses + 1) * 200);
              }
              return 3000; // 失敗：重置時間
            },
            distance: ({ context, event }) => {
              // 成功則前進
              return event.key === context.currentKey ? Math.max(0, context.distance - 50) : context.distance;
            },
            currentKey: ({ context, event }) => {
               // 無論成功失敗都換下一個鍵 (或者失敗可以不換? 這裡選擇換)
               return generateRandomKey();
            },
            narrativeLog: ({ context, event }) => {
              const isSuccess = event.key === context.currentKey;
              const newLog = [...context.narrativeLog];
              
              if (isSuccess) {
                newLog.push({ type: 'system', text: '✅ 操作正確！車輛平穩前進。' });
              } else {
                newLog.push({ type: 'system', text: '❌ 操作錯誤！車輛發生碰撞！耐久度下降！' });
                if (context.consecutiveErrors + 1 >= 3) {
                   newLog.push({ type: 'system', text: '⚠️ 連續操作失誤！引擎即將熄火！' });
                }
              }
              return newLog;
            }
          }),
        },
        
        // 檢查是否熄火
        CHECK_STALL: {
          target: 'carStalled',
          guard: ({ context }) => context.consecutiveErrors >= 3
        },

        // 檢查是否到達
        CHECK_ARRIVAL: {
          target: 'atGate',
          guard: ({ context }) => context.distance <= 50
        },
        
        // 時間到 (視為錯誤)
        QTE_FAIL: {
          actions: assign({
            consecutiveErrors: ({ context }) => context.consecutiveErrors + 1,
            consecutiveSuccesses: 0,
            carDurability: ({ context }) => Math.max(0, context.carDurability - 10),
            currentKey: () => generateRandomKey(),
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'system', text: '⏰ 反應太慢！操作超時！' }
            ]
          })
        }
      },
      
      // 每次狀態更新後檢查轉換條件
      always: [
        { target: 'carStalled', guard: ({ context }) => context.consecutiveErrors >= 3 },
        { target: 'atGate', guard: ({ context }) => context.distance <= 50 }
      ]
    },

    // 狀態 4: 車輛熄火
    carStalled: {
      entry: assign({
        engineRunning: false,
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: '🛑 引擎熄火了！連續操作不當導致系統強制停機。' },
          { type: 'system', text: '💡 請點擊 [重新啟動引擎] 進行修復。' }
        ]
      }),
      
      on: {
        RESTART_ENGINE: {
          target: 'restartingEngine',
          actions: assign({
            targetSequence: generateRandomSequence(4),
            currentSequence: [],
            qteTimeLeft: 3,
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你嘗試重新發動引擎...' },
              { type: 'system', text: '⚡ 啟動程序介入！請完成按鍵序列！' }
            ]
          })
        }
      }
    },

    // 狀態 5: 重新啟動引擎 (QTE)
    restartingEngine: {
      on: {
        KEY_PRESS: {
          actions: assign({
            currentSequence: ({ context, event }) => {
              const newSequence = [...context.currentSequence, event.key];
              const targetKey = context.targetSequence[context.currentSequence.length];
              if (event.key !== targetKey) return [];
              return newSequence;
            }
          }),
          guard: ({ context, event }) => {
            const targetKey = context.targetSequence[context.currentSequence.length];
            return event.key === targetKey;
          }
        },

        QTE_SUCCESS: {
          target: 'drivingTutorial',
          actions: assign({
            engineRunning: true,
            consecutiveErrors: 0,
            consecutiveSuccesses: 0, // 重啟後難度重置
            drivingQteTimeLimit: 3000,
            currentKey: generateRandomKey(),
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'system', text: '✅ 引擎重啟成功！恢復駕駛教學。' }
            ]
          })
        },

        QTE_FAIL: {
          target: 'carStalled', // 失敗回到熄火狀態
          actions: assign({
            currentSequence: [],
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'system', text: '❌ 重啟失敗！請再試一次。' }
            ]
          })
        },
        
        RESET_SEQUENCE: {
          actions: assign({
            currentSequence: [],
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'system', text: '⚠️ 按錯了！序列重置。' }
            ]
          })
        }
      }
    },

    // 狀態 6: 在柵欄前
    atGate: {
      entry: assign({
        coapPackets: ({ context }) => [
          ...context.coapPackets,
          {
            timestamp: new Date().toISOString(),
            hex: '40 01 A3 2F B2 67 61 74 65 FF 35 30',
            decoded: 'CON GET /gate → Distance: 50cm'
          }
        ],
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: '📦 CoAP 封包已發送' },
          { type: 'narrator', text: '⏳ 柵欄感應器正在處理...' }
        ]
      }),

      on: {
        OPEN_GATE: {
          target: 'gateOpening',
          actions: assign({
            mqttLogs: ({ context }) => [
              ...context.mqttLogs,
              {
                timestamp: new Date().toISOString(),
                topic: 'parking/gate/control',
                payload: { cmd: 'OPEN', distance: context.distance }
              }
            ],
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你按下遙控器按鈕...' },
              { type: 'system', text: '📡 MQTT: Topic=parking/gate/control, Payload={"cmd":"OPEN"}' }
            ]
          })
        }
      }
    },

    // 狀態 7: 柵欄開啟中
    gateOpening: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'narrator', text: '🚧 柵欄開始緩緩升起，伺服馬達發出嗡嗡聲...' }
        ]
      }),

      after: {
        2000: {
          target: 'gateOpen',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'system', text: '✅ 柵欄已完全開啟！' }
            ]
          })
        }
      }
    },

    // 狀態 8: 柵欄已開啟
    gateOpen: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'narrator', text: '🛣️ 道路暢通！你可以駛入停車區了。' }
        ]
      }),

      on: {
        PARK_CAR: {
          target: 'parked',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你小心翼翼地駛入停車格...' },
              { type: 'narrator', text: '🅿️ 車輛停穩，引擎熄火。任務完成！' }
            ]
          })
        }
      }
    },

    // 狀態 9: 已停車（遊戲結束）
    parked: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { type: 'system', text: '🎉 恭喜！你成功完成了停車任務！' },
          { type: 'system', text: `📊 統計數據：剩餘耐久度 ${context.carDurability}%` },
          { type: 'system', text: ` CoAP 封包發送：${context.coapPackets.length} 個` },
          { type: 'system', text: `📡 MQTT 訊息：${context.mqttLogs.length} 條` }
        ]
      }),

      on: {
        RESTART: {
          target: 'idle',
          actions: assign({
            narrativeLog: [
              { type: 'system', text: '🔄 遊戲重新開始...' },
              { type: 'narrator', text: '🌅 你再次站在停車場前...' }
            ],
            targetSequence: generateRandomSequence(4),
            currentSequence: [],
            qteTimeLeft: 3,
            qteAttempts: 0,
            distance: 1000,
            mqttLogs: [],
            coapPackets: [],
            engineRunning: false,
            carDurability: 100,
            consecutiveErrors: 0,
            consecutiveSuccesses: 0,
            drivingQteTimeLimit: 3000
          })
        }
      }
    }
  }
});

// 方向鍵符號映射
export const getArrowSymbol = (key) => {
  const symbols = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→'
  };
  return symbols[key] || '?';
};
