import { setup, assign, fromCallback, fromPromise } from 'xstate';

/**
 * XState v5 Parking Game Machine (Setup API)
 * Professional implementation with live variable support
 */

// Email Service Actor
const sendEmailActor = fromPromise(async ({ input }) => {
  const { to, subject, text } = input;
  console.log(`Attempting to send email to ${to}...`);
  try {
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text })
    });
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    const result = await response.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't crash the game, just log it
    return { error: error.message };
  }
});

// Generate random arrow key sequence
const generateArrowSequence = (length = 4) => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  return Array.from({ length }, () => keys[Math.floor(Math.random() * keys.length)]);
};

// Arrow key symbols
export const getArrowSymbol = (key) => {
  const map = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→'
  };
  return map[key] || key;
};

export const parkingGameMachine = setup({
  types: {
    context: {},
    events: {}
  },

  actions: {
    updateCurrentText: assign((_, params) => ({
      currentText: params
    })),

    updateScene: assign((_, params) => ({
      backgroundImage: params.background || 'parking-lot',
      characterImage: params.character || 'narrator'
    })),

    addLog: assign(({ context }, params) => {
      let text = params.text;
      if (text && typeof text === 'string' && context.userEmail) {
        text = text.replace('{{userEmail}}', context.userEmail);
      }
      return {
        logs: [
          ...context.logs,
          { type: params.type, text: text, timestamp: new Date().toISOString() }
        ]
      };
    }),

    assignEmail: assign(({ event }) => ({
      userEmail: event.email
    })),

    updateState: assign((_, params) => ({
      currentState: params
    })),

    initQTE: assign(() => ({
      qteSequence: generateArrowSequence(),
      qteProgress: 0
    })),

    advanceQTE: assign(({ context }) => ({
      qteProgress: context.qteProgress + 1
    })),

    startEngine: assign(() => ({
      engineRunning: true,
      distance: 500
    })),

    decreaseDistance: assign(({ context }) => ({
      distance: Math.max(0, context.distance - 10)
    })),

    updateDistance: assign(({ event }) => {
      if (event.type === 'DISTANCE_UPDATE') {
        return { distance: Math.max(0, event.distance) };
      }
      return {};
    }),

    resetGame: assign(() => ({
      distance: 500,
      engineRunning: false,
      qteSequence: [],
      qteProgress: 0,
      logs: [],
      currentText: '',
      backgroundImage: 'parking-lot',
      characterImage: 'narrator',
      currentState: 'intro1',
      userEmail: '',
      hasSpaghetti: false,
      boundaryVisits: 0,
      isTimeSkipped: false
    })),

    pickUpSpaghetti: assign(() => ({
      hasSpaghetti: true
    })),

    incrementBoundaryVisits: assign(({ context }) => ({
      boundaryVisits: (context.boundaryVisits || 0) + 1
    })),

    skipTime: assign(() => ({
      isTimeSkipped: true
    }))
  },

  guards: {
    qteCorrectKey: ({ context, event }) => {
      if (event.type !== 'QTE_KEY') return false;
      return event.key === context.qteSequence[context.qteProgress];
    },

    qteComplete: ({ context }) => {
      return context.qteProgress >= context.qteSequence.length;
    },

    barrierCanOpen: ({ context }) => {
      return context.distance < 50;
    },

    checkBoundaryTrigger: ({ context }) => {
      return (context.boundaryVisits || 0) >= 3;
    },

    hasSpaghetti: ({ context }) => {
      return context.hasSpaghetti;
    }
  }
}).createMachine({
  id: 'parkingGame',
  initial: 'intro1',
  
  context: {
    distance: 500,
    engineRunning: false,
    qteSequence: [],
    qteProgress: 0,
    logs: [],
    currentText: '',
    backgroundImage: 'parking-lot',
    characterImage: 'narrator',
    hasSpaghetti: false,
    boundaryVisits: 0,
    isTimeSkipped: false,
    currentState: 'intro1',
    userEmail: ''
  },

  states: {
    intro1: {
      entry: [
        { type: 'updateState', params: 'intro1' },
        { type: 'updateCurrentText', params: '2025年12月24日，平安夜。你還在公司獨自加班，改著永遠改不完的 Bug...' },
        { type: 'updateScene', params: { background: 'black', character: 'narrator' } },
        { type: 'addLog', params: { type: 'narrative', text: '🏢 加班夜' } }
      ],
      on: { NEXT: 'intro2' }
    },
    intro2: {
      entry: [
        { type: 'updateState', params: 'intro2' },
        { type: 'updateCurrentText', params: '突然，你的螢幕發出一陣刺眼的白光，將你整個人吞沒！' },
        { type: 'updateScene', params: { background: 'white', character: 'narrator' } },
        { type: 'addLog', params: { type: 'system', text: '⚡ 傳送啟動' } }
      ],
      on: { NEXT: 'intro3' }
    },
    intro3: {
      entry: [
        { type: 'updateState', params: 'intro3' },
        { type: 'updateCurrentText', params: '「這裡是哪裡？這不是辦公室...」你發現自己身處一個充滿科技感的異世界停車場。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🌍 抵達異世界' } }
      ],
      on: { NEXT: 'intro4' }
    },
    intro4: {
      entry: [
        { type: 'updateState', params: 'intro4' },
        { type: 'updateCurrentText', params: '「那裡有一輛車...看起來能動。」你走向那輛熟悉的智能車。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'action', text: '👀 發現車輛' } }
      ],
      on: { NEXT: 'inCar' }
    },

    inCar: {
      entry: [
        { type: 'updateState', params: 'inCar' },
        { type: 'updateCurrentText', params: '你坐在駕駛座上。引擎是冷的。距離：{{distance}} 公分' },
        { type: 'updateScene', params: { background: 'car-interior', character: 'driver' } },
        { type: 'addLog', params: { type: 'narrative', text: '🚗 進入車輛' } }
      ],
      on: {
        NEXT: {
          target: 'qteSequence',
          actions: ['initQTE']
        }
      }
    },

    qteSequence: {
      entry: [
        { type: 'updateState', params: 'qteSequence' },
        { type: 'updateCurrentText', params: '⚡ 引擎啟動挑戰！依照順序按下方向鍵！' },
        { type: 'addLog', params: { type: 'qte', text: '🎯 QTE 挑戰開始' } }
      ],
      on: {
        KEY_PRESS: [
          {
            guard: ({ context, event }) => event.key === context.qteSequence[context.qteProgress],
            actions: [
              'advanceQTE',
              { type: 'addLog', params: { type: 'qte', text: '✅ 按鍵正確' } }
            ]
          },
          {
            target: 'engineStall'
          }
        ],
        QTE_SUCCESS: {
          guard: 'qteComplete',
          target: 'driving',
          actions: [
            'startEngine',
            { type: 'addLog', params: { type: 'success', text: '🎉 引擎啟動成功！' } }
          ]
        }
      }
    },

    engineStall: {
      entry: [
        { type: 'updateState', params: 'engineStall' },
        { type: 'updateCurrentText', params: '引擎咳嗽了一聲後熄火了。再試一次。' },
        { type: 'addLog', params: { type: 'fail', text: '💀 引擎熄火' } }
      ],
      on: {
        RETRY: {
          target: 'qteSequence',
          actions: ['initQTE']
        }
      }
    },

    driving: {
      entry: [
        { type: 'updateState', params: 'driving' },
        { type: 'updateCurrentText', params: '引擎轟鳴！向前行駛中...' },
        { type: 'updateScene', params: { background: 'car-interior', character: 'driver' } },
        { type: 'addLog', params: { type: 'mqtt', text: '📡 MQTT PUBLISH → vehicle/motion/start' } }
      ],
      on: {
        DISTANCE_REACHED: 'atGate',
        GAME_OVER: 'engineStall'
      }
    },

    atGate: {
      entry: [
        { type: 'updateState', params: 'atGate' },
        { type: 'updateCurrentText', params: '[SYSTEM]: 感測器偵測到車輛。柵欄升起中...\n\n[PROTAGONIST]: 顯示屏上閃爍著入場時間... 我得記住這個時間，出去時可能需要繳費。' },
        { type: 'updateScene', params: { background: 'gate', character: 'system' } },
        { type: 'addLog', params: { type: 'sensor', text: '📏 距離：0 公分 (TARGET REACHED)' } },
        { type: 'addLog', params: { type: 'info', text: '🕒 入場時間：23:50:00' } }
      ],
      after: {
        3000: 'gateOpening'
      }
    },

    gateOpening: {
      entry: [
        { type: 'updateState', params: 'gateOpening' },
        { type: 'updateCurrentText', params: '閘門緩緩升起。你聽到了伺服馬達的聲音。' },
        { type: 'addLog', params: { type: 'mqtt', text: '📡 MQTT PUBLISH → gate/open' } },
        { type: 'addLog', params: { type: 'coap', text: '📦 CoAP POST → coap://gate-controller/open' } }
      ],
      on: {
        PARK: 'parked'
      }
    },

    parked: {
      entry: [
        { type: 'updateState', params: 'parked' },
        { type: 'updateCurrentText', params: '成功！你已經停好了智能車。任務完成。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'narrator' } },
        { type: 'addLog', params: { type: 'success', text: '🎉 任務完成！' } },
        { type: 'addLog', params: { type: 'sql', text: '💾 SQL INSERT → parking_records' } }
      ],
      on: {
        EXIT_CAR: 'postDriveChoice',
        RESTART: {
          target: 'intro1',
          actions: ['resetGame']
        }
      }
    },

    postDriveChoice: {
      entry: [
        { type: 'updateState', params: 'postDriveChoice' },
        { type: 'updateCurrentText', params: '[SYSTEM]: 車輛已停妥。請選擇接下來的行動。\n\n[PROTAGONIST]: 下車了。但這裡感覺... 有點不太對勁。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🤔 遭遇異常選擇' } }
      ],
      on: {
        CHOOSE_CAT: 'outcomeCat',
        CHOOSE_SPAGHETTI: 'outcomeSpaghetti',
        CHOOSE_BOUNDARY: 'outcomeBoundary',
        GO_PAY: 'outsideCar'
      }
    },

    outcomeCat: {
      entry: [
        { type: 'updateState', params: 'outcomeCat' },
        { type: 'updateCurrentText', params: '[PROTAGONIST]: 這裡有一隻貓咪... 牠在不停地旋轉？而且還發出奇怪的 "OIIAI" 聲音...\n\n[ACTION]: 你試著靠近。\n\n[PROTAGONIST]: 牠注意到我了。貓咪停止了旋轉，直勾勾地盯著我看。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'cat' } },
        { type: 'addLog', params: { type: 'narrative', text: '🐱 發現旋轉貓咪' } }
      ],
      on: {
        PET_CAT: 'endingBlackhole',
        FEED_CAT: 'endingRemix',
        BACK: 'postDriveChoice'
      }
    },

    outcomeSpaghetti: {
      entry: [
        { type: 'updateState', params: 'outcomeSpaghetti' },
        { type: 'updateCurrentText', params: '[PROTAGONIST]: 地上有一盤... 義大利麵？\n\n[PROTAGONIST]: 為什麼空曠的停車場地上會有一盤完好的義大利麵？這太不合理了。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'spaghetti' } },
        { type: 'addLog', params: { type: 'narrative', text: '🍝 發現義大利麵' } }
      ],
      on: {
        EAT_SPAGHETTI: 'endingDance',
        TAKE_SPAGHETTI: {
          target: 'postDriveChoice',
          actions: ['pickUpSpaghetti', { type: 'addLog', params: { type: 'item', text: '🍝 獲得：義大利麵' } }]
        },
        BACK: 'postDriveChoice'
      }
    },

    endingBlackhole: {
      entry: [
        { type: 'updateState', params: 'endingBlackhole' },
        'skipTime',
        { type: 'updateCurrentText', params: '[ACTION]: 你伸出手摸了摸貓咪...\n\n[SOUND]: OIIAI OIIAI OIIAI...\n\n[PROTAGONIST]: 貓咪開始高速旋轉，速度快到產生了殘影！\n\n[SYSTEM]: 警告！偵測到重力奇點！\n\n[PROTAGONIST]: 哇啊啊啊啊被吸進去了——' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'cat' } },
        { type: 'addLog', params: { type: 'event', text: '🌌 觸發結局：黑洞貓' } }
      ],
      after: {
        7000: 'outsideCar'
      }
    },

    endingDance: {
      entry: [
        { type: 'updateState', params: 'endingDance' },
        'skipTime',
        { type: 'updateCurrentText', params: '[ACTION]: 你決定吃掉地上的義大利麵。\n\n[PROTAGONIST]: ...？！身體... 身體自己動起來了！\n\n[MUSIC]: ♫ 이빨 사이 낀 spaghetti 빼고 싶니? Bon appétit ♫\n\n[MUSIC]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫\n\n[MUSIC]: ♫ (Ooh) 머릿속 낀 SSERAFIM, bad bitch in between your teeth ♫\n\n[MUSIC]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'spaghetti' } },
        { type: 'addLog', params: { type: 'event', text: '💃 觸發結局：義大利麵之舞' } }
      ],
      after: {
        29000: 'outsideCar'
      }
    },

    endingRemix: {
      entry: [
        { type: 'updateState', params: 'endingRemix' },
        'skipTime',
        { type: 'updateCurrentText', params: '[ACTION]: 你把義大利麵餵給了貓咪。\n\n[PROTAGONIST]: ...？！\n\n[MUSIC]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫\n\n[SOUND]: OIA OIII OIA IIA\n\n[SOUND]: OIA OIII OIA OIOIA' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'cat' } },
        { type: 'addLog', params: { type: 'event', text: '🎧 觸發結局：OIIA REMIX' } }
      ],
      after: {
        12000: 'outsideCar'
      }
    },

    outcomeBoundary: {
      entry: [
        { type: 'updateState', params: 'outcomeBoundary' },
        'incrementBoundaryVisits',
        { type: 'updateCurrentText', params: '[PROTAGONIST]: 不管這些了，先離開這裡再說。我像往常一樣走向出口...\n\n[SOUND]: *砰！*\n\n[PROTAGONIST]: 好痛！我撞到了什麼？前面明明什麼都沒有...\n\n[ACTION]: 你伸出手向前摸索。\n\n[PROTAGONIST]: 這是... 一堵看不見的牆？我摸到了這個空間的「邊界」。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'boundary' } },
        { type: 'addLog', params: { type: 'narrative', text: '🚫 觸碰世界邊界' } }
      ],
      always: [
        {
          guard: 'checkBoundaryTrigger',
          target: 'mysteriousEvent'
        }
      ],
      on: {
        BACK: 'postDriveChoice'
      }
    },

    mysteriousEvent: {
      entry: [
        { type: 'updateState', params: 'mysteriousEvent' },
        'skipTime',
        { type: 'updateCurrentText', params: '[MYSTERIOUS]: "你來得太早了，旅人。"\n\n[PROTAGONIST]: 誰？你是誰？\n\n[MYSTERIOUS]: "這裡還不是你該來的地方。讓我幫你一把..."\n\n[ACTION]: 神秘人揮了揮手，周圍的景象開始扭曲。\n\n[SYSTEM]: 時間跳躍 +2 小時。異常現象已清除。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'mysterious' } },
        { type: 'addLog', params: { type: 'event', text: '🔮 觸發神秘事件：時間跳躍' } }
      ],
      on: {
        GO_PAY: 'outsideCar'
      }
    },

    outsideCar: {
      entry: [
        { type: 'updateState', params: 'outsideCar' },
        { type: 'updateCurrentText', params: '你走出車外。空氣很清新。你現在安全了。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'narrator' } },
        { type: 'addLog', params: { type: 'narrative', text: '🚶 離開車輛' } }
      ],
      on: {
        PAY: 'inputEmail',
        RESTART: {
          target: 'intro1',
          actions: ['resetGame']
        }
      }
    },

    inputEmail: {
      entry: [
        { type: 'updateState', params: 'inputEmail' },
        { type: 'updateCurrentText', params: '請輸入您的電子信箱以接收繳費通知與收據。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'system' } }
      ],
      on: {
        SUBMIT_EMAIL: {
          target: 'ntpSync',
          actions: ['assignEmail']
        }
      }
    },

    ntpSync: {
      entry: [
        { type: 'updateState', params: 'ntpSync' },
        { type: 'updateCurrentText', params: '正在連接 NTP 伺服器同步時間...' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'system' } },
        { type: 'addLog', params: { type: 'ntp', text: '🕒 NTP Query → pool.ntp.org' } }
      ],
      invoke: {
        src: fromCallback(({ sendBack }) => {
          const timer = setTimeout(() => {
            sendBack({ type: 'NTP_DONE' });
          }, 2000);
          return () => clearTimeout(timer);
        })
      },
      on: {
        NTP_DONE: {
          target: 'paymentInfo',
          actions: [
            { type: 'addLog', params: { type: 'ntp', text: '✅ NTP Sync: 2025-12-24 20:45:12.003' } },
            { type: 'addLog', params: { type: 'smtp', text: '📧 SMTP Auth: youarebearpromax@gmail.com' } },
            { type: 'addLog', params: { type: 'smtp', text: '📨 Sending Bill Notification to {{userEmail}}...' } },
            assign({ notification: { title: '停車繳費通知', body: '您有一筆待繳停車費 $120。請儘速繳納。' } })
          ]
        }
      }
    },

    paymentInfo: {
      entry: [
        { type: 'updateState', params: 'paymentInfo' },
        { type: 'updateCurrentText', params: '停車時間：2小時。費用：$120。繳費通知已發送至您的信箱。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'system' } }
      ],
      invoke: {
        src: sendEmailActor,
        input: ({ context }) => ({
          to: context.userEmail,
          subject: '停車繳費通知',
          text: '您有一筆待繳停車費 $120。請儘速繳納。'
        })
      },
      on: {
        CONFIRM_PAY: 'paymentSuccess'
      }
    },

    paymentSuccess: {
      entry: [
        { type: 'updateState', params: 'paymentSuccess' },
        { type: 'updateCurrentText', params: '繳費成功！收據已發送。感謝您的使用。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'system' } },
        { type: 'addLog', params: { type: 'smtp', text: '📨 Sending Receipt to {{userEmail}}' } },
        assign({ notification: { title: '繳費成功通知', body: '您的停車費 $120 已繳納成功。電子發票號碼：AB-12345678' } }),
        { type: 'addLog', params: { type: 'success', text: '💰 Transaction Verified' } }
      ],
      invoke: {
        src: sendEmailActor,
        input: ({ context }) => ({
          to: context.userEmail,
          subject: '繳費成功通知',
          text: '您的停車費 $120 已繳納成功。電子發票號碼：AB-12345678'
        })
      },
      on: {
        RESTART: {
          target: 'intro1',
          actions: ['resetGame']
        }
      }
    }
  }
});
