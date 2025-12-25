import { createMachine, assign } from 'xstate';

/**
 * XState v5 狀態機 - 文字冒險遊戲版智慧停車場
 * 
 * 狀態流程：
 * entrance_idle → sensing_vehicle → processing_ticket → gate_opening → parked → payment → exit
 */

export const parkingAdventureMachine = createMachine({
  id: 'parkingAdventure',
  initial: 'entrance_idle',
  
  context: {
    distance: 200, // HC-SR04 感測器距離 (cm)
    ticketId: null,
    vehicleId: null,
    entryTime: null,
    parkingFee: 0,
    narrativeLog: [
      { type: 'system', text: '🚗 歡迎來到智慧停車場模擬器' },
      { type: 'system', text: '這是一個互動式文字冒險遊戲，體驗 IoT Digital Twin 技術' }
    ],
    mqttLogs: [],
    coapPackets: [],
    sqlRecords: []
  },

  states: {
    // 狀態 1: 入口閒置
    entrance_idle: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { 
            type: 'narrator', 
            text: '📍 你正站在智慧停車場的入口處。前方是一個自動柵欄，旁邊有一個票券機。' 
          },
          { 
            type: 'narrator', 
            text: '🌟 你可以按下票券按鈕來觸發超聲波感測器。' 
          }
        ]
      }),
      
      on: {
        APPROACH: {
          target: 'sensing_vehicle',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你按下了票券按鈕...' }
            ]
          })
        }
      }
    },

    // 狀態 2: 感測車輛
    sensing_vehicle: {
      entry: [
        assign({
          distance: 200, // 初始距離
          narrativeLog: ({ context }) => [
            ...context.narrativeLog,
            { 
              type: 'system', 
              text: '📡 HC-SR04 超聲波感測器啟動中...' 
            }
          ]
        }),
        // 模擬 MQTT 發送
        assign({
          mqttLogs: ({ context }) => [
            ...context.mqttLogs,
            {
              timestamp: new Date().toISOString(),
              topic: 'parking/sensor/trigger',
              payload: { action: 'START_SCAN', timestamp: Date.now() }
            }
          ]
        })
      ],

      // 自動動畫：距離從 200 -> 45cm
      invoke: {
        src: 'animateDistance',
        onDone: {
          target: 'vehicle_detected',
          actions: assign({
            distance: 45,
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { 
                type: 'system', 
                text: '✅ 偵測到車輛！距離: 45 cm' 
              },
              {
                type: 'narrator',
                text: '🚗 感測器確認了你的車輛存在。系統正在計算距離...'
              }
            ]
          })
        }
      }
    },

    // 狀態 3: 車輛已偵測
    vehicle_detected: {
      entry: assign({
        coapPackets: ({ context }) => [
          ...context.coapPackets,
          {
            timestamp: new Date().toISOString(),
            hex: '40 01 3A 4F B2 73 65 6E 73 6F 72 FF 34 35',
            decoded: 'CON GET /sensor/distance → 45cm'
          }
        ]
      }),

      on: {
        REQUEST_TICKET: {
          target: 'processing_ticket',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你按下了「取票」按鈕' }
            ]
          })
        }
      }
    },

    // 狀態 4: 處理票券
    processing_ticket: {
      entry: [
        assign({
          ticketId: () => `TKT-${Date.now()}`,
          vehicleId: () => `VEH-${Math.floor(Math.random() * 9999)}`,
          entryTime: () => new Date().toISOString(),
          narrativeLog: ({ context }) => [
            ...context.narrativeLog,
            { 
              type: 'system', 
              text: '🎫 正在連接票務系統...' 
            },
            {
              type: 'system',
              text: '🗄️ SQL Query: INSERT INTO parking_logs (vehicle_id, entry_time) VALUES (...)'
            }
          ]
        }),
        // 模擬 NTP 時間同步
        assign({
          narrativeLog: ({ context }) => [
            ...context.narrativeLog,
            { 
              type: 'system', 
              text: '⏰ NTP 時間同步: pool.ntp.org → 偏移 +2.3ms' 
            }
          ]
        })
      ],

      after: {
        2000: {
          target: 'ticket_issued',
          actions: [
            assign({
              sqlRecords: ({ context }) => [
                ...context.sqlRecords,
                {
                  id: context.sqlRecords.length + 1,
                  ticketId: context.ticketId,
                  vehicleId: context.vehicleId,
                  entryTime: new Date(context.entryTime).toLocaleString('zh-TW'),
                  fee: 0
                }
              ],
              narrativeLog: ({ context }) => [
                ...context.narrativeLog,
                { 
                  type: 'system', 
                  text: `✅ 票券已發出！票號: ${context.ticketId}` 
                },
                {
                  type: 'narrator',
                  text: '📄 一張熱騰騰的停車票從機器中滑出。上面印著你的車輛編號和進場時間。'
                }
              ]
            })
          ]
        }
      }
    },

    // 狀態 5: 票券已發出
    ticket_issued: {
      on: {
        OPEN_GATE: {
          target: 'gate_opening',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你拿著票券靠近感應區...' }
            ]
          })
        }
      }
    },

    // 狀態 6: 柵欄開啟中
    gate_opening: {
      entry: [
        assign({
          mqttLogs: ({ context }) => [
            ...context.mqttLogs,
            {
              timestamp: new Date().toISOString(),
              topic: 'parking/gate/control',
              payload: { cmd: 'OPEN', ticketId: context.ticketId }
            }
          ],
          narrativeLog: ({ context }) => [
            ...context.narrativeLog,
            { 
              type: 'system', 
              text: '📡 MQTT 發送: Topic=parking/gate/control, Payload={"cmd":"OPEN"}' 
            },
            {
              type: 'narrator',
              text: '🚧 柵欄開始緩緩升起，發出低沉的機械聲...'
            }
          ]
        })
      ],

      after: {
        3000: {
          target: 'gate_open',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { 
                type: 'system', 
                text: '✅ 柵欄已完全開啟' 
              }
            ]
          })
        }
      }
    },

    // 狀態 7: 柵欄已開啟
    gate_open: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          {
            type: 'narrator',
            text: '🚗 道路暢通！你可以駛入停車場了。'
          }
        ]
      }),

      on: {
        DRIVE_IN: {
          target: 'parked',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你駕車穿過柵欄，進入停車場...' }
            ]
          })
        }
      }
    },

    // 狀態 8: 已停車
    parked: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          {
            type: 'narrator',
            text: '🅿️ 你找到了一個空位，順利停好車。引擎熄火，一切安靜下來。'
          },
          {
            type: 'system',
            text: '⏱️ 停車計時開始...'
          },
          {
            type: 'narrator',
            text: '⏳ 時間流逝...（模擬快轉）'
          },
          {
            type: 'system',
            text: '💰 計費系統: 停車時長 2 小時 → 費用 NT$ 60'
          }
        ],
        parkingFee: 60
      }),

      on: {
        PAY_AND_LEAVE: {
          target: 'payment',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你決定離開，前往繳費機...' }
            ]
          })
        }
      }
    },

    // 狀態 9: 支付流程
    payment: {
      entry: [
        assign({
          narrativeLog: ({ context }) => [
            ...context.narrativeLog,
            { 
              type: 'system', 
              text: `💳 應繳費用: NT$ ${context.parkingFee}` 
            },
            {
              type: 'narrator',
              text: '你在自動繳費機前插入信用卡...'
            },
            {
              type: 'system',
              text: '🔒 HTTPS TLS 握手: ClientHello → ServerHello → 證書驗證 ✅'
            },
            {
              type: 'system',
              text: '💳 支付處理中...'
            }
          ]
        }),
        // 模擬 SQL 更新
        assign({
          sqlRecords: ({ context }) => 
            context.sqlRecords.map(record =>
              record.ticketId === context.ticketId
                ? { ...record, fee: context.parkingFee }
                : record
            )
        })
      ],

      after: {
        2000: {
          target: 'sending_receipt',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { 
                type: 'system', 
                text: '✅ 支付成功！' 
              }
            ]
          })
        }
      }
    },

    // 狀態 10: 發送收據
    sending_receipt: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          { 
            type: 'system', 
            text: '📧 正在通過 SMTP 發送電子收據...' 
          },
          {
            type: 'system',
            text: '📤 連接到 mail.server.com:587...'
          },
          {
            type: 'system',
            text: '✅ 220 ESMTP Ready'
          },
          {
            type: 'system',
            text: '📤 MAIL FROM: <noreply@smartpark.com>'
          },
          {
            type: 'system',
            text: '✅ 250 OK'
          },
          {
            type: 'system',
            text: '📧 收據已發送到您的電子郵箱'
          }
        ]
      }),

      after: {
        2000: {
          target: 'exit_gate',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              {
                type: 'narrator',
                text: '✅ 交易完成！出口柵欄自動開啟。'
              }
            ]
          })
        }
      }
    },

    // 狀態 11: 出口柵欄
    exit_gate: {
      on: {
        EXIT: {
          target: 'game_over',
          actions: assign({
            narrativeLog: ({ context }) => [
              ...context.narrativeLog,
              { type: 'player', text: '> 你駕車離開停車場...' }
            ]
          })
        }
      }
    },

    // 狀態 12: 遊戲結束
    game_over: {
      entry: assign({
        narrativeLog: ({ context }) => [
          ...context.narrativeLog,
          {
            type: 'narrator',
            text: '🎉 你已成功完成智慧停車場的完整體驗！'
          },
          {
            type: 'system',
            text: '📊 統計數據:'
          },
          {
            type: 'system',
            text: `   • 票券編號: ${context.ticketId}`
          },
          {
            type: 'system',
            text: `   • 車輛編號: ${context.vehicleId}`
          },
          {
            type: 'system',
            text: `   • 停車費用: NT$ ${context.parkingFee}`
          },
          {
            type: 'system',
            text: `   • MQTT 訊息: ${context.mqttLogs.length} 條`
          },
          {
            type: 'system',
            text: `   • CoAP 封包: ${context.coapPackets.length} 個`
          },
          {
            type: 'narrator',
            text: '感謝遊玩！這個模擬展示了現代 IoT 停車場的完整技術棧。'
          }
        ]
      }),

      on: {
        RESTART: {
          target: 'entrance_idle',
          actions: assign({
            distance: 200,
            ticketId: null,
            vehicleId: null,
            entryTime: null,
            parkingFee: 0,
            narrativeLog: [
              { type: 'system', text: '🔄 遊戲重新開始...' }
            ],
            mqttLogs: [],
            coapPackets: [],
            sqlRecords: []
          })
        }
      }
    }
  }
});

// Actors/Services
export const services = {
  animateDistance: () => 
    new Promise((resolve) => {
      // 模擬距離動畫 (200cm -> 45cm，持續 2 秒)
      setTimeout(resolve, 2000);
    })
};
