import { createMachine, assign } from 'xstate';

/**
 * XState v5 - Visual Novel Style Smart Parking Game
 * 
 * States: start -> inCar -> qteSequence -> driving -> atGate -> gateOpening -> parked
 */

// Generate random arrow key sequence
const generateQTESequence = () => {
  const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const sequence = [];
  for (let i = 0; i < 4; i++) {
    sequence.push(arrows[Math.floor(Math.random() * arrows.length)]);
  }
  return sequence;
};

// Map arrow keys to symbols
export const getArrowSymbol = (key) => {
  const symbols = {
    'ArrowUp': '⬆️',
    'ArrowDown': '⬇️',
    'ArrowLeft': '⬅️',
    'ArrowRight': '➡️'
  };
  return symbols[key] || key;
};

export const visualNovelMachine = createMachine({
  id: 'visualNovel',
  initial: 'start',
  
  context: {
    currentText: '',
    distance: 500, // Ultrasonic sensor distance
    qteSequence: [],
    qteProgress: 0,
    logs: [],
    backgroundImage: 'parking-lot',
    characterImage: 'narrator'
  },

  states: {
    // State 1: Start
    start: {
      entry: assign({
        currentText: '你被傳送到一個陌生的世界。一輛車停在附近。',
        backgroundImage: 'parking-lot',
        characterImage: 'narrator',
        logs: ({ context }) => [
          ...context.logs,
          { type: 'system', text: '🎮 遊戲開始', timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        NEXT: {
          target: 'inCar',
          actions: assign({
            logs: ({ context }) => [
              ...context.logs,
              { type: 'action', text: '✅ 選擇: [進入車內]', timestamp: new Date().toISOString() }
            ]
          })
        }
      }
    },

    // State 2: In Car
    inCar: {
      entry: assign({
        currentText: '你坐在駕駛座上。引擎是冷的。準備啟動引擎...',
        backgroundImage: 'car-interior',
        characterImage: 'driver',
        logs: ({ context }) => [
          ...context.logs,
          { type: 'narrative', text: '🚗 進入車內', timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        NEXT: {
          target: 'qteSequence',
          actions: assign({
            qteSequence: generateQTESequence(),
            qteProgress: 0
          })
        }
      }
    },

    // State 3: QTE Sequence (Engine Start Challenge)
    qteSequence: {
      entry: assign({
        currentText: '⚡ 引擎啟動挑戰！快速按下正確的方向鍵序列！',
        logs: ({ context }) => {
          const sequence = context.qteSequence.map(getArrowSymbol).join(' ');
          return [
            ...context.logs,
            { type: 'qte', text: `🎯 QTE開始！序列: ${sequence}`, timestamp: new Date().toISOString() }
          ];
        }
      }),
      
      on: {
        KEY_PRESS: [
          {
            guard: ({ context, event }) => {
              // Check if key matches current position in sequence
              return event.key === context.qteSequence[context.qteProgress];
            },
            actions: assign({
              qteProgress: ({ context }) => context.qteProgress + 1,
              logs: ({ context, event }) => [
                ...context.logs,
                { 
                  type: 'qte', 
                  text: `✅ 正確! ${getArrowSymbol(event.key)} (${context.qteProgress + 1}/${context.qteSequence.length})`, 
                  timestamp: new Date().toISOString() 
                }
              ]
            })
          },
          {
            target: 'engineStall',
            actions: assign({
              logs: ({ context, event }) => [
                ...context.logs,
                { 
                  type: 'qte', 
                  text: `❌ 錯誤! 按下: ${getArrowSymbol(event.key)}, 預期: ${getArrowSymbol(context.qteSequence[context.qteProgress])}`, 
                  timestamp: new Date().toISOString() 
                }
              ]
            })
          }
        ],
        
        QTE_SUCCESS: {
          target: 'driving',
          guard: ({ context }) => context.qteProgress >= context.qteSequence.length,
          actions: assign({
            logs: ({ context }) => [
              ...context.logs,
              { type: 'success', text: '🎉 QTE完成！引擎成功啟動！', timestamp: new Date().toISOString() }
            ]
          })
        }
      }
    },

    // State 4: Engine Stall (QTE Failed)
    engineStall: {
      entry: assign({
        currentText: '引擎咳嗽幾聲後熄火了。再試一次...',
        qteProgress: 0,
        logs: ({ context }) => [
          ...context.logs,
          { type: 'fail', text: '💀 引擎熄火', timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        RETRY: {
          target: 'qteSequence',
          actions: assign({
            qteSequence: generateQTESequence(),
            qteProgress: 0
          })
        }
      }
    },

    // State 5: Driving
    driving: {
      entry: assign({
        currentText: '引擎轟鳴！你開始向前駛去。前方柵欄逐漸靠近...',
        distance: 500,
        logs: ({ context }) => [
          ...context.logs,
          { type: 'mqtt', text: '📡 MQTT PUBLISH → vehicle/motion/start', timestamp: new Date().toISOString() },
          { type: 'system', text: '🚗 開始駕駛模式', timestamp: new Date().toISOString() }
        ]
      }),
      
      // Auto-update distance
      invoke: {
        id: 'distanceSimulation',
        src: 'animateDistance'
      },
      
      on: {
        UPDATE_DISTANCE: {
          actions: assign({
            distance: ({ event }) => event.distance
          })
        },
        
        DISTANCE_REACHED: {
          target: 'atGate',
          guard: ({ context }) => context.distance <= 50
        }
      }
    },

    // State 6: At Gate
    atGate: {
      entry: assign({
        currentText: '你到達停車柵欄。紅燈亮著。',
        logs: ({ context }) => [
          ...context.logs,
          { type: 'sensor', text: `📏 超聲波: ${context.distance}cm - 障礙物偵測`, timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        OPEN_GATE: {
          target: 'gateOpening',
          actions: assign({
            logs: ({ context }) => [
              ...context.logs,
              { type: 'action', text: '✅ 選擇: [開啟閘門]', timestamp: new Date().toISOString() }
            ]
          })
        }
      }
    },

    // State 7: Gate Opening
    gateOpening: {
      entry: assign({
        currentText: '柵欄緩緩升起。你聽到伺服馬達的聲音。',
        logs: ({ context }) => [
          ...context.logs,
          { type: 'mqtt', text: '📡 MQTT PUBLISH → gate/open', timestamp: new Date().toISOString() },
          { type: 'coap', text: '📦 CoAP POST → coap://gate-controller/open', timestamp: new Date().toISOString() },
          { type: 'system', text: '🚪 閘門開啟中...', timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        PARK: {
          target: 'parked',
          actions: assign({
            logs: ({ context }) => [
              ...context.logs,
              { type: 'action', text: '✅ 選擇: [停車]', timestamp: new Date().toISOString() }
            ]
          })
        }
      }
    },

    // State 8: Parked
    parked: {
      entry: assign({
        currentText: '你成功停車！這是一個智慧停車場系統的完美演示。',
        distance: 10,
        logs: ({ context }) => [
          ...context.logs,
          { type: 'success', text: '🎉 任務完成！車輛已停放', timestamp: new Date().toISOString() },
          { type: 'sql', text: '💾 SQL INSERT → parking_records', timestamp: new Date().toISOString() }
        ]
      }),
      
      on: {
        RESTART: {
          target: 'start',
          actions: assign({
            distance: 500,
            qteSequence: [],
            qteProgress: 0,
            logs: []
          })
        }
      }
    }
  }
});

// Service implementation for distance animation
export const distanceSimulationService = (context) => (sendBack) => {
  let currentDistance = 500;
  const interval = setInterval(() => {
    currentDistance -= 10;
    sendBack({ type: 'UPDATE_DISTANCE', distance: currentDistance });
    
    if (currentDistance <= 50) {
      sendBack({ type: 'DISTANCE_REACHED' });
      clearInterval(interval);
    }
  }, 200);
  
  return () => clearInterval(interval);
};
