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
    const response = await fetch('/api/send-email', {
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

    startEngine: assign(({ context }) => ({
      engineRunning: true,
      distance: (context.distance > 0 && context.distance < 500) ? context.distance : 500
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
      isTimeSkipped: false,
      parkedHours: 0,
      parkingFee: 0,
      lastEnding: null
    })),

    pickUpSpaghetti: assign(() => ({
      hasSpaghetti: true
    })),

    incrementBoundaryVisits: assign(({ context }) => ({
      boundaryVisits: (context.boundaryVisits || 0) + 1
    })),

    skipTime: assign(() => ({
      isTimeSkipped: true
    })),

    setDuration1Hour: assign({ parkedHours: 1, lastEnding: 'mysterious' }),
    setDuration2Hours: assign({ parkedHours: 2, lastEnding: 'blackhole' }),
    setDuration3Hours: assign({ parkedHours: 3, lastEnding: 'dance' }),
    setDuration4Hours: assign({ parkedHours: 4, lastEnding: 'remix' }),
    
    calculateFee: assign(({ context }) => ({
      parkingFee: (context.parkedHours || 1) * 60 // $60 per hour
    })),

    updateTransitionText: assign(({ context }) => {
      let intro = "";
      switch(context.lastEnding) {
        case 'mysterious':
          intro = "[主角]: 意識逐漸清晰... 頭好痛。\n[主角]: 剛剛那個穿斗篷的人是誰？這一切都太不真實了。\n[主角]: 看了看手錶，時間好像過了一小時... 算了，應該可以離開了。";
          break;
        case 'blackhole':
          intro = "[主角]: 咳... 咳... 我還活著？\n[主角]: 我剛剛是真的被一隻貓吸進黑洞了嗎？這什麼爛設定？\n[主角]: 感覺像是做了一場兩小時的惡夢。先離開這裡再說。";
          break;
        case 'dance':
          intro = "[主角]: 呼... 呼... 累死我了...\n[主角]: 為什麼吃了地上的義大利麵會不由自主地跳三個小時的舞？\n[主角]: 這遊戲的物理引擎和邏輯絕對壞掉了。腿好痠...";
          break;
        case 'remix':
          intro = "[主角]: ..................\n[主角]: 貓咪... 義大利麵... 旋轉... 混音...\n[主角]: 我的大腦在顫抖。這個世界已經沒有邏輯可言了。毀滅吧，趕緊累了。";
          break;
        default:
          intro = "[主角]: ...發生了什麼？";
      }
      return {
        currentText: `${intro}\n\n[未知聲音]: （廣播聲）「親愛的用戶，感謝您的體驗。請記得繳費才能離場。」\n[主角]: ......行吧，繳費就繳費。`
      };
    })
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
    userEmail: '',
    parkedHours: 0,
    parkingFee: 0,
    lastEnding: null
  },

  states: {
    intro1: {
      entry: [
        { type: 'updateState', params: 'intro1' },
        { type: 'updateCurrentText', params: '[日期]: 2025年10月14日, 週二\n[時間]: 23:48\n[地點]: 臥室\n\n又是平凡的一天。你剛結束了疲憊的工作，只想在《歐洲卡車模擬器 2》裡找點平靜。\n你熟練地戴上耳機，方向盤傳來熟悉的觸感。這次的任務很簡單：從柏林運送一批電子零件到華沙。\n高速公路 A12 上下著小雨，車窗上的雨刷有節奏地擺動著。收音機裡播放著深夜的 Lo-Fi 音樂，一切都令人安心。' },
        { type: 'updateScene', params: { background: 'black', character: 'narrator' } },
        { type: 'addLog', params: { type: 'narrative', text: '🎮 啟動歐卡2' } }
      ],
      on: { NEXT: 'intro2' }
    },
    intro2: {
      entry: [
        { type: 'updateState', params: 'intro2' },
        { type: 'updateCurrentText', params: '直到你的 GPS 導航螢幕閃爍了一下。\n\n[系統]: 正在重新計算路徑...\n[主角]: 「奇怪，我沒走錯路啊？」\n\n你看向螢幕，原本的路線導引變成了一串紅色的亂碼。\n緊接著，遊戲裡的「天空」貼圖開始剝落，露出了背後漆黑的網格。\n耳機裡的 Lo-Fi 音樂變成了尖銳的雜訊聲，方向盤的力回饋突然瘋狂震動，彷彿有什麼東西抓住了輪胎。' },
        { type: 'updateScene', params: { background: 'black', character: 'narrator' } },
        { type: 'addLog', params: { type: 'system', text: '⚠️ 系統異常' } }
      ],
      on: { NEXT: 'intro3' }
    },
    intro3: {
      entry: [
        { type: 'updateState', params: 'intro3' },
        { type: 'updateCurrentText', params: '[系統]: 錯誤。錯誤。偵測到未授權的驅動程式。\n[系統]: 正在強制同步實體...\n\n你下意識地想按 Alt+F4，但你的手穿過了鍵盤——不，是鍵盤融化成了綠色的數據流，順著你的指尖向上蔓延。\n視線陷入一片黑暗，最後聽到的聲音，是電腦主機發出的、如同引擎過熱般的轟鳴聲...' },
        { type: 'updateScene', params: { background: 'black', character: 'narrator' } },
        { type: 'addLog', params: { type: 'system', text: '⚡ 強制傳送' } }
      ],
      on: { NEXT: 'introStory1' }
    },
    introStory1: {
      entry: [
        { type: 'updateState', params: 'introStory1' },
        { type: 'updateCurrentText', params: '再次睜開眼時，雨聲依舊，但這裡不是華沙，也不是你的臥室。\n\n> 初始化現實介面... 完成。\n> 載入遊戲: Euro Truck Simulator 2\n> 任務: 長途運輸 | 漢堡 -> 巴黎\n> 狀態: 精神疲勞，定速巡航中 (90 km/h)\n\n[主角]: 只是想跑個長途單放鬆一下...' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🌍 抵達裏世界 (1/3)' } }
      ],
      on: { NEXT: 'introStory2' }
    },
    introStory2: {
      entry: [
        { type: 'updateState', params: 'introStory2' },
        { type: 'updateCurrentText', params: '[主角]: 等等，為什麼幀數(FPS)突然掉到 0 了？\n\n> 警告: 顯卡溫度異常\n> 警告: 記憶體溢出 (Memory Overflow)\n> 系統錯誤: 偵測到外部維度干涉\n\n[主角]: 螢幕... 螢幕裂開了？不，是空間裂開了？' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🌍 抵達裏世界 (2/3)' } }
      ],
      on: { NEXT: 'introStory3' }
    },
    introStory3: {
      entry: [
        { type: 'updateState', params: 'introStory3' },
        { type: 'updateCurrentText', params: '> 啟動緊急傳送協議...\n> 目標座標: 未知數據庫 // 賽博空間_停車場\n> 載入資產: 智能車輛 [Car_Model_X]\n> 覆蓋玩家意識... \n\n[系統]: 傳送完成。歡迎來到「裏世界」。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🌍 抵達裏世界 (3/3)' } }
      ],
      on: { NEXT: 'tutorialIntro' }
    },

    tutorialIntro: {
      entry: [
        { type: 'updateState', params: 'tutorialIntro' },
        { type: 'updateCurrentText', params: '[系統]: 生物特徵掃描完成...\n\n[車載智能]: 警告：資料庫中未找到您的駕駛執照紀錄。\n\n[車載智能]: 根據安全協議，強制啟動「新手引導模式」。\n\n[車載智能]: 系統偵測到外部輸入裝置。請參閱上方圖示熟悉操作配置。\n\n[車載智能]: 確認完畢後，請點擊畫面解除安全鎖定。' },
        { type: 'updateScene', params: { background: 'car-interior', character: 'system' } },
        { type: 'addLog', params: { type: 'system', text: '🔰 啟動新手引導' } }
      ],
      on: {
        NEXT: 'inCar'
      }
    },

    inCar: {
      entry: [
        { type: 'updateState', params: 'inCar' },
        { type: 'updateCurrentText', params: '[主角]: 「等等，我明早還要上班啊！我的全勤獎金——」\n\n你的聲音被數位的風暴淹沒。\n當你的意識恢復時，手裡握著的不再是塑膠方向盤，而是真皮與金屬的冰冷觸感。\n這絕對不是歐洲卡車模擬器。這畫面太真實了，顯卡燃燒都跑不動的那種真實。\n\n你坐在駕駛座上。引擎是冷的。距離：{{distance}} 公分' },
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
        { type: 'updateCurrentText', params: '[車載智能]: 點火系統準備就緒。等待手動同步...\n>>> 請依照 HUD 指示輸入點火序列 <<<' },
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
        { type: 'updateCurrentText', params: '[警告]: 操作失誤過多，引擎強制熄火。請重新啟動。' },
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
        { type: 'updateCurrentText', params: '[系統]: 感測器偵測到車輛。柵欄升起中...\n\n[主角]: 顯示屏上閃爍著入場時間... 我得記住這個時間，出去時可能需要繳費。' },
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
        { type: 'updateCurrentText', params: '[系統]: 座標校正完畢。車輛已停妥。\n[系統]: 電子手煞車... 鎖定。液壓懸吊... 洩壓完畢。\n[聲音]: (引擎運轉聲逐漸消失，只剩下冷卻風扇的微弱嗡鳴)\n[車載智能]: 動力系統已切斷。感謝您的駕駛。\n[車載智能]: 車門已解鎖。祝您夜晚愉快。' },
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
        { type: 'updateCurrentText', params: '[系統]: 車輛已停妥。請選擇接下來的行動。\n\n[主角]: 下車了。但這裡感覺... 有點不太對勁。' },
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
        { type: 'updateCurrentText', params: '[主角]: 這裡有一隻貓咪... 牠在不停地旋轉？而且還發出奇怪的 "OIIAI" 聲音...\n\n[動作]: 你試著靠近。\n\n[主角]: 牠注意到我了。貓咪停止了旋轉，直勾勾地盯著我看。' },
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
        { type: 'updateCurrentText', params: '[主角]: 地上有一盤... 義大利麵？\n\n[主角]: 為什麼空曠的停車場地上會有一盤完好的義大利麵？這太不合理了。' },
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
        { type: 'updateCurrentText', params: '[動作]: 你伸出手摸了摸貓咪...\n\n[聲音]: OIIAI OIIAI OIIAI...\n\n[主角]: 貓咪開始高速旋轉，速度快到產生了殘影！\n\n[系統]: 警告！偵測到重力奇點！\n\n[主角]: 哇啊啊啊啊被吸進去了——' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'cat' } },
        { type: 'addLog', params: { type: 'event', text: '🌌 觸發結局：黑洞貓' } }
      ],
      after: {
        7000: {
          target: 'transitionToPayment',
          actions: ['setDuration2Hours']
        }
      }
    },

    endingDance: {
      entry: [
        { type: 'updateState', params: 'endingDance' },
        'skipTime',
        { type: 'updateCurrentText', params: '[動作]: 你決定吃掉地上的義大利麵。\n\n[主角]: ...？！身體... 身體自己動起來了！\n\n[音樂]: ♫ 이빨 사이 낀 spaghetti 빼고 싶니? Bon appétit ♫\n\n[音樂]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫\n\n[音樂]: ♫ (Ooh) 머릿속 낀 SSERAFIM, bad bitch in between your teeth ♫\n\n[音樂]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'spaghetti' } },
        { type: 'addLog', params: { type: 'event', text: '💃 觸發結局：義大利麵之舞' } }
      ],
      after: {
        29000: {
          target: 'transitionToPayment',
          actions: ['setDuration3Hours']
        }
      }
    },

    endingRemix: {
      entry: [
        { type: 'updateState', params: 'endingRemix' },
        'skipTime',
        { type: 'updateCurrentText', params: '[動作]: 你把義大利麵餵給了貓咪。\n\n[主角]: ...？！\n\n[音樂]: ♫ 그냥 포기해 어차피, eat it up, eat it, eat it up ♫\n\n[聲音]: OIA OIII OIA IIA\n\n[聲音]: OIA OIII OIA OIOIA' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'cat' } },
        { type: 'addLog', params: { type: 'event', text: '🎧 觸發結局：OIIA REMIX' } }
      ],
      after: {
        12000: {
          target: 'transitionToPayment',
          actions: ['setDuration4Hours']
        }
      }
    },

    outcomeBoundary: {
      entry: [
        { type: 'updateState', params: 'outcomeBoundary' },
        'incrementBoundaryVisits',
        { type: 'updateCurrentText', params: '[主角]: 不管這些了，先離開這裡再說。我像往常一樣走向出口...\n\n[聲音]: *砰！*\n\n[主角]: 好痛！我撞到了什麼？前面明明什麼都沒有...\n\n[動作]: 你伸出手向前摸索。\n\n[主角]: 這是... 一堵看不見的牆？我摸到了這個空間的「邊界」。' },
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
        { type: 'updateCurrentText', params: '[神秘人]: "你來得太早了，旅人。"\n\n[主角]: 誰？你是誰？\n\n[神秘人]: "這裡還不是你該來的地方。讓我幫你一把..."\n\n[動作]: 神秘人揮了揮手，周圍的景象開始扭曲。\n\n[系統]: 時間跳躍 +1 小時。異常現象已清除。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'mysterious' } },
        { type: 'addLog', params: { type: 'event', text: '🔮 觸發神秘事件：時間跳躍' } }
      ],
      on: {
        GO_PAY: {
          target: 'transitionToPayment',
          actions: ['setDuration1Hour']
        }
      }
    },

    transitionToPayment: {
      entry: [
        { type: 'updateState', params: 'transitionToPayment' }
      ],
      always: 'outsideCar'
    },

    outsideCar: {
      entry: [
        { type: 'updateState', params: 'outsideCar' },
        'updateTransitionText',
        { type: 'updateScene', params: { background: 'parking-lot', character: 'protagonist' } },
        { type: 'addLog', params: { type: 'narrative', text: '🚶 離開車輛' } }
      ],
      on: {
        PAY: 'inputEmail'
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
            assign(({ context }) => {
              const fee = (context.parkedHours || 1) * 60;
              return {
                notification: { 
                  title: '停車繳費通知', 
                  body: `您有一筆待繳停車費 $${fee}。請儘速繳納。` 
                }
              };
            })
          ]
        }
      }
    },

    paymentInfo: {
      entry: [
        { type: 'updateState', params: 'paymentInfo' },
        'calculateFee',
        { type: 'updateCurrentText', params: '停車時間：{{parkedHours}}小時。費用：${{parkingFee}}。繳費通知已發送至您的信箱。' },
        { type: 'updateScene', params: { background: 'parking-lot', character: 'system' } }
      ],
      invoke: {
        src: sendEmailActor,
        input: ({ context }) => ({
          to: context.userEmail,
          subject: '停車繳費通知',
          text: `您有一筆待繳停車費 $${(context.parkedHours || 1) * 60}。請儘速繳納。`
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
        assign(({ context }) => {
          const fee = (context.parkedHours || 1) * 60;
          return {
            notification: { 
              title: '繳費成功通知', 
              body: `您的停車費 $${fee} 已繳納成功。電子發票號碼：AB-12345678` 
            }
          };
        }),
        { type: 'addLog', params: { type: 'success', text: '💰 Transaction Verified' } }
      ],
      invoke: {
        src: sendEmailActor,
        input: ({ context }) => ({
          to: context.userEmail,
          subject: '繳費成功通知',
          text: `您的停車費 $${(context.parkedHours || 1) * 60} 已繳納成功。電子發票號碼：AB-12345678`
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
