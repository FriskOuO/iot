
import { createMachine, assign, fromCallback, fromPromise } from 'xstate';

/**
 * XState v5 - Meme Parking Adventure (New Game+ Auto Pilot Edition)
 * * 功能更新：
 * 1. 增加 gameCleared 標記，判斷是否為二周目
 * 2. inCar 狀態增加 AUTO_PILOT 選項 (跳過 QTE)
 */

const generateQTESequence = () => {
  const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const sequence = [];
  for (let i = 0; i < 4; i++) {
    sequence.push(arrows[Math.floor(Math.random() * arrows.length)]);
  }
  return sequence;
};

export const getArrowSymbol = (key) => {
  const symbols = { 'ArrowUp': '👆', 'ArrowDown': '👇', 'ArrowLeft': '👈', 'ArrowRight': '👉' };
  return symbols[key] || key;
};

export const visualNovelMachine = createMachine({
  id: 'visualNovel',
  initial: 'start',
  
  context: {
    currentText: '',
    distance: 500,
    qteSequence: [],
    qteProgress: 0,
    failCount: 0,
    wallHitCount: 0,
    hasSpaghetti: false,
    parkingHours: 0,
    gameCleared: false, // 新增：通關標記 (二周目開啟自動駕駛)
    isAutoPilot: false, // 新增：自動駕駛狀態
    email: '', // 新增：使用者信箱
    notification: null, // 新增：虛擬手機通知
    parkedHours: 0, // 新增：停車時數
    logs: [],
    backgroundImage: 'parking-lot',
    characterImage: 'narrator'
  },

  states: {
    // --- 第一階段：進場 ---
    start: {
      entry: assign({
        currentText: ({ context }) => context.gameCleared 
          ? '系統重新載入... 偵測到您是尊貴的 VIP 用戶 (二周目)。\n正在連接 NTP 伺服器校時...' 
          : '系統載入中... 你站在這充滿迷因氣息的停車場入口。\n正在連接 NTP 伺服器校時...',
        backgroundImage: 'parking-lot',
        // 重置單局變數，但保留 gameCleared
        distance: 500,
        hasSpaghetti: false,
        wallHitCount: 0,
        failCount: 0,
        parkingHours: 0,
        isAutoPilot: false,
        logs: ({ context }) => {
          const initialLog = { type: 'system', text: '🌍 World Init: Meme_Parking_Lot', timestamp: new Date().toISOString() };
          // 如果是二周目，多加一行提示
          return context.gameCleared 
            ? [initialLog, { type: 'system', text: '💎 VIP Mode Active: 自動駕駛已解鎖', timestamp: new Date().toISOString() }]
            : [initialLog];
        }
      }),
      invoke: {
        src: fromPromise(async () => {
          try {
            const t0 = Date.now();
            // 使用相對路徑，透過 package.json 的 proxy 轉發到後端
            const res = await fetch(`/api/ntp?t0=${t0}`);
            
            // 檢查回應是否為 JSON
            const contentType = res.headers.get("content-type");
            if (!res.ok) {
                const text = await res.text();
                console.error(`NTP Error ${res.status}:`, text);
                throw new Error(`NTP Sync Failed: ${res.status}`);
            }
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("NTP Expected JSON, got:", text.substring(0, 200));
                throw new Error("NTP Sync Failed: Invalid Response Type (Not JSON)");
            }

            return res.json();
          } catch (err) {
            console.error('NTP Fetch Error:', err);
            throw err;
          }
        }),
        onDone: {
          actions: assign({
            currentText: ({ context, event }) => {
              const { serverTime } = event.output;
              const baseText = context.gameCleared 
                ? '系統重新載入... 偵測到您是尊貴的 VIP 用戶 (二周目)。' 
                : '系統載入中... 你站在這充滿迷因氣息的停車場入口。';
              return `${baseText}\n\n✅ NTP 同步完成\n伺服器時間: ${new Date(serverTime).toLocaleString()}`;
            },
            logs: ({ context, event }) => {
              const { t1, t2, t3, stratum, serverTime } = event.output;
              const t4 = Date.now();
              const offset = ((t2 - t1) + (t3 - t4)) / 2;
              return [...context.logs, { 
                type: 'success', 
                text: `⏰ NTP Sync: Stratum ${stratum}, Offset ${offset.toFixed(2)}ms`, 
                timestamp: serverTime 
              }];
            }
          })
        },
        onError: {
          actions: assign({
            currentText: ({ context, event }) => {
              const baseText = context.gameCleared 
                ? '系統重新載入... 偵測到您是尊貴的 VIP 用戶 (二周目)。' 
                : '系統載入中... 你站在這充滿迷因氣息的停車場入口。';
              return `${baseText}\n\n⚠️ NTP 同步失敗: ${event.error.message || 'Unknown Error'} (使用本地時間)`;
            },
            logs: ({ context, event }) => [...context.logs, { type: 'fail', text: `⚠️ NTP Sync Failed: ${event.error.message}`, timestamp: new Date().toISOString() }]
          })
        }
      },
      on: {
        NEXT: {
          target: 'inCar',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '👉 進入駕駛座', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    // --- 車內 (加入自動駕駛選項) ---
    inCar: {
      entry: assign({
        currentText: ({ context }) => context.gameCleared
          ? '駕駛座上閃爍著「自動駕駛」的按鈕。你要自己開還是交給 AI？'
          : '駕駛座上有一股陳舊的程式碼味道。要做什麼？',
        backgroundImage: 'car-interior',
        logs: ({ context }) => [...context.logs, { type: 'narrative', text: '👀 等待指令...', timestamp: new Date().toISOString() }]
      }),
      on: {
        NEXT: {
          target: 'simpleDrivingMode',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '👉 啟動引擎', timestamp: new Date().toISOString() }]
          })
        },
        // 新增：自動駕駛 (二周目限定)
        AUTO_PILOT: {
          target: 'driving', // 直接跳去開車，略過 QTE
          guard: ({ context }) => context.gameCleared, // 保護機制：只有通關過才能用
          actions: assign({
            isAutoPilot: true,
            logs: ({ context }) => [...context.logs, { type: 'success', text: '🤖 啟動特斯拉(低配版)自動駕駛', timestamp: new Date().toISOString() }]
          })
        },
        DO_NOTHING: {
          target: 'endingBSOD',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '😴 選擇：原地睡死', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    // --- 簡易駕駛模式 (教學) ---
    simpleDrivingMode: {
      entry: assign({
        currentText: '系統偵測到駕駛沒有證照，所以開啟簡易駕駛模式',
        backgroundImage: 'teach',
        logs: ({ context }) => [...context.logs, { type: 'system', text: '⚠️ No License Detected. Switching to Simple Mode.', timestamp: new Date().toISOString() }]
      }),
      invoke: {
        src: fromCallback(({ sendBack }) => {
          const timeout = setTimeout(() => sendBack({ type: 'AUTO_TRANSITION' }), 3000);
          return () => clearTimeout(timeout);
        })
      },
      on: {
        AUTO_TRANSITION: {
          target: 'qteSequence',
          actions: assign({ qteSequence: generateQTESequence(), qteProgress: 0 })
        }
      }
    },

    // --- QTE (保持不變) ---
    qteSequence: {
      entry: assign({
        currentText: '🔥 帝王引擎啟動儀式！輸入指令！',
        logs: ({ context }) => {
          const sequence = context.qteSequence.map(getArrowSymbol).join(' ');
          return [...context.logs, { type: 'qte', text: `🎮 序列: ${sequence}`, timestamp: new Date().toISOString() }];
        }
      }),
      on: {
        KEY_PRESS: [
          {
            guard: ({ context, event }) => event.key === context.qteSequence[context.qteProgress],
            actions: assign({
              qteProgress: ({ context }) => context.qteProgress + 1,
              logs: ({ context, event }) => [...context.logs, { type: 'qte', text: `✨ 正確: ${getArrowSymbol(event.key)}`, timestamp: new Date().toISOString() }]
            })
          },
          {
            target: 'engineStall',
            actions: assign({
              failCount: ({ context }) => context.failCount + 1,
              logs: ({ context, event }) => [...context.logs, { type: 'fail', text: `❌ 手滑了`, timestamp: new Date().toISOString() }]
            })
          }
        ],
        QTE_SUCCESS: {
          target: 'driving',
          guard: ({ context }) => context.qteProgress >= context.qteSequence.length,
          actions: assign({
            isAutoPilot: false,
            logs: ({ context }) => [...context.logs, { type: 'success', text: '🏎️ 引擎咆哮：OIIA OIIA', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    engineStall: {
      entry: assign({
        currentText: '引擎熄火並嘲笑了你。',
        qteProgress: 0
      }),
      always: [
        { target: 'endingBSOD', guard: ({ context }) => context.failCount >= 3 }
      ],
      on: {
        RETRY: {
          target: 'qteSequence',
          actions: assign({
            qteSequence: generateQTESequence(),
            qteProgress: 0,
            logs: ({ context }) => [...context.logs, { type: 'action', text: '🔄 再試一次', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    // --- 駕駛過程 ---
    driving: {
      entry: assign({
        currentText: '車子自動導航中... 物理引擎正在運作。',
        distance: 500,
        logs: ({ context }) => [...context.logs, { type: 'mqtt', text: '📡 Moving to Gate...', timestamp: new Date().toISOString() }]
      }),
      invoke: { 
        id: 'distanceSimulation', 
        input: ({ context }) => ({ isAutoPilot: context.isAutoPilot }),
        src: fromCallback(({ input, sendBack }) => {
          if (!input.isAutoPilot) return; // 手動模式：不執行自動扣減，等待外部事件

          let currentDistance = 500;
          const interval = setInterval(() => {
            currentDistance -= 20;
            sendBack({ type: 'UPDATE_DISTANCE', distance: currentDistance });
            if (currentDistance <= 50) {
              sendBack({ type: 'DISTANCE_REACHED' });
              clearInterval(interval);
            }
          }, 100);
          return () => clearInterval(interval);
        })
      },
      on: {
        UPDATE_DISTANCE: { actions: assign({ distance: ({ event }) => event.distance }) },
        DISTANCE_REACHED: { target: 'atGate', guard: ({ context }) => context.distance <= 50 },
        GAME_OVER: {
          target: 'engineStall',
          actions: assign({
            failCount: ({ context }) => context.failCount + 1,
            logs: ({ context }) => [...context.logs, { type: 'fail', text: '💥 駕駛失誤：引擎熄火', timestamp: new Date().toISOString() }]
          })
        },
        ENGINE_STALL: {
          target: 'engineStall',
          actions: assign({
            failCount: ({ context }) => context.failCount + 1,
            logs: ({ context }) => [...context.logs, { type: 'fail', text: '💥 駕駛失誤：引擎熄火', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    // --- 閘門前 ---
    atGate: {
      entry: assign({
        currentText: '到達閘門。感測器正在讀取你的靈魂。',
        distance: 0,
        logs: ({ context }) => [...context.logs, { type: 'system', text: '🔍 Scanning...', timestamp: new Date().toISOString() }]
      }),
      invoke: {
        src: fromCallback(({ sendBack }) => {
          const timeout = setTimeout(() => sendBack({ type: 'AUTO_OPEN' }), 1500);
          return () => clearTimeout(timeout);
        })
      },
      on: {
        AUTO_OPEN: {
          target: 'gateOpening',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '🤖 閘門自動開啟', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    gateOpening: {
      entry: assign({
        currentText: '閘門開啟，歡迎來到迷因停車場。',
        logs: ({ context }) => [...context.logs, { type: 'coap', text: '📦 Gate Open', timestamp: new Date().toISOString() }]
      }),
      after: {
        1500: 'parked'
      }
    },

    // --- 停車場 Hub (自由探索) ---
    parked: {
      entry: assign({
        currentText: ({ context }) => {
            if (context.hasSpaghetti) {
                return '你停好車了。遠處有一隻旋轉的貓咪。你的口袋裡裝著那坨義大利麵。';
            }
            return '你停好車了。左邊有一隻旋轉的貓咪，右邊飄浮著一坨義大利麵。後方是出口牆。';
        },
        backgroundImage: 'parking-lot', 
        logs: ({ context }) => [...context.logs, { type: 'system', text: '🅿️ 進入自由探索模式', timestamp: new Date().toISOString() }]
      }),
      on: {
        GO_CAT: { target: 'interactCat' },
        GO_SPAGHETTI: { target: 'interactSpaghetti' },
        GO_EXIT: { target: 'interactExit' }
      }
    },

    // --- 貓咪互動 ---
    interactCat: {
      entry: assign({
        currentText: '那隻貓咪正在以 3000 RPM 的速度旋轉，發出 "OIIA OIIA" 的聲音。',
        characterImage: 'oiia-cat', 
        logs: ({ context }) => [...context.logs, { type: 'narrative', text: '🐱 遭遇迷因貓', timestamp: new Date().toISOString() }]
      }),
      on: {
        TOUCH_CAT: {
          target: 'endingBlackHole',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '✋ 試圖摸貓', timestamp: new Date().toISOString() }]
          })
        },
        FEED_CAT: {
          target: 'endingCatChaos', 
          guard: ({ context }) => context.hasSpaghetti, 
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '🍝 獻祭義大利麵', timestamp: new Date().toISOString() }]
          })
        },
        BACK: { target: 'parked' }
      }
    },

    // --- 義大利麵互動 ---
    interactSpaghetti: {
      entry: assign({
        currentText: ({ context }) => context.hasSpaghetti 
            ? '義大利麵已經被你拿走了，這裡只剩盤子的殘影。' 
            : '一坨熱騰騰的義大利麵漂浮在半空中，看起來很不科學。',
        characterImage: ({ context }) => context.hasSpaghetti ? 'spaghetti_eaten' : 'spaghetti',
        logs: ({ context }) => [...context.logs, { type: 'narrative', text: '🍝 發現義大利麵', timestamp: new Date().toISOString() }]
      }),
      on: {
        EAT_SPAGHETTI: {
          target: 'endingSpaghettiDance',
          guard: ({ context }) => !context.hasSpaghetti, 
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'action', text: '🍴 暴風吸入', timestamp: new Date().toISOString() }]
          })
        },
        PICK_UP: {
          target: 'parked',
          guard: ({ context }) => !context.hasSpaghetti,
          actions: assign({
            hasSpaghetti: true,
            logs: ({ context }) => [...context.logs, { type: 'success', text: '🎒 獲得道具：義大利麵', timestamp: new Date().toISOString() }]
          })
        },
        BACK: { target: 'parked' }
      }
    },

    // --- 邊界互動 ---
    interactExit: {
      entry: assign({
        currentText: ({ context }) => `前方是一道空氣牆。開發者好像還沒做這裡的地圖。(撞擊次數: ${context.wallHitCount})`,
        logs: ({ context }) => [...context.logs, { type: 'narrative', text: '🧱 到達地圖邊界', timestamp: new Date().toISOString() }]
      }),
      on: {
        HIT_WALL: [
          {
            target: 'endingAdmin',
            guard: ({ context }) => context.wallHitCount >= 2, 
            actions: assign({
              wallHitCount: ({ context }) => context.wallHitCount + 1,
              logs: ({ context }) => [...context.logs, { type: 'fail', text: '💥 邊界崩壞！', timestamp: new Date().toISOString() }]
            })
          },
          {
            actions: assign({
              wallHitCount: ({ context }) => context.wallHitCount + 1,
              currentText: ({ context }) => `你用力撞了一下牆壁。好像有裂痕了... (撞擊次數: ${context.wallHitCount + 1})`,
              logs: ({ context }) => [...context.logs, { type: 'action', text: '👊 物理攻擊牆壁', timestamp: new Date().toISOString() }]
            })
          }
        ],
        BACK: { target: 'parked' }
      }
    },

    // --- 結局群 ---

    // 1. 黑洞 (+2h)
    endingBlackHole: {
      entry: assign({
        currentText: '【結局：奇異點】你伸手摸了貓咪。貓咪瞬間加速到光速旋轉，發出震耳欲聾的 "OIIA OIIA" 聲！空間開始扭曲，一個巨大的「迷因黑洞」將你吞噬。當你回過神來，已經過了 2 個小時，周圍的景物全部消失，只剩下虛空...',
        backgroundImage: 'static-noise',
        parkingHours: 2,
        logs: ({ context }) => [...context.logs, { type: 'fail', text: '🌌 警告：時空連續性破裂 (+2h)', timestamp: new Date().toISOString() }]
      }),
      on: { NEXT: 'paymentNarrative' }
    },

    // 2. 貓麵混亂 (+4h)
    endingCatChaos: {
      entry: assign({
        currentText: '【結局：精神汙染】你把麵餵給了貓。剎那間，世界崩壞了！視野被成千上萬張「旋轉的貓」、「義大利麵」和「你的臉」填滿！這場 3000 RPM 的視覺風暴持續了整整 4 個小時，你的 SAN 值已歸零。',
        backgroundImage: 'oiia-cat', 
        parkingHours: 4,
        logs: ({ context }) => [...context.logs, { type: 'success', text: '😵 系統過載：迷因溢出 (+4h)', timestamp: new Date().toISOString() }]
      }),
      on: { NEXT: 'paymentNarrative' }
    },

    // 3. 舞力全開 (+1h)
    endingSpaghettiDance: {
      entry: assign({
        currentText: '【結局：舞力全開】你吞下了那坨飄浮的麵。那不是麵，是「節奏」！你的四肢開始不受控制，在這裡跳起了長達 1 小時的機械舞。你的身體很累，但靈魂在燃燒！',
        characterImage: 'protagonist',
        parkingHours: 1,
        logs: ({ context }) => [...context.logs, { type: 'success', text: '💃 狀態異常：強制熱舞 (+1h)', timestamp: new Date().toISOString() }]
      }),
      on: { NEXT: 'paymentNarrative' }
    },

    // 4. 管理員 (+3h)
    endingAdmin: {
      entry: assign({
        currentText: '【結局：管理員介入】牆壁碎裂了。一個全身發光的神秘人把你抓到了虛擬空間的「小黑屋」。他對你進行了長達 3 小時關於「不要亂撞空氣牆」的說教。',
        characterImage: 'mysterious-man', 
        parkingHours: 3,
        logs: ({ context }) => [...context.logs, { type: 'fail', text: '👮 管理員：封鎖行動 (+3h)', timestamp: new Date().toISOString() }]
      }),
      on: { NEXT: 'paymentNarrative' }
    },

    // 5. BSOD (睡死/失敗) - 不解鎖自動駕駛
    endingBSOD: {
      entry: assign({
        currentText: ({ context }) => context.failCount >= 3
          ? '【結局：藍屏死機】經過三次失敗的嘗試，引擎決定自我毀滅以示抗議。系統崩潰。:('
          : '【結局：藍屏死機】你選擇了什麼都不做，直到世界終結。系統判定玩家已斷線。:(',
        backgroundImage: 'blue-screen',
        logs: ({ context }) => [...context.logs, { type: 'fail', text: '💻 FATAL ERROR', timestamp: new Date().toISOString() }]
      }),
      on: { RESTART: { target: 'start' } } // 注意：這裡不會解鎖 gameCleared
    },

    // --- 繳費與結算 ---
    paymentNarrative: {
      entry: assign({
        currentText: ({ context }) => `(一切突然安靜下來) 虛空中傳來一個低沉的神祕聲音：「...鬧夠了嗎？無論你是被黑洞吸走、跳舞還是被管理員抓走... 停車費還是要算的。」\n\n「你總共佔用了 ${context.parkingHours} 小時的伺服器資源。繳費才能離開這個異世界！」`,
        parkedHours: ({ context }) => context.parkingHours,
        logs: ({ context }) => [...context.logs, { type: 'system', text: `💰 產生帳單: NT$ ${context.parkingHours * 100}`, timestamp: new Date().toISOString() }]
      }),
      on: {
        PROCEED_TO_PAY: 'paymentInput'
      }
    },

    paymentInput: {
      entry: assign({
        currentText: '' // Clear text to collapse the narrative area
      }),
      on: {
        SUBMIT_EMAIL: {
          target: 'sendingEmail',
          actions: assign({
            email: ({ event }) => event.email,
            notification: ({ context }) => ({
              title: '停車繳費通知',
              body: `您有一筆待繳停車費。請儘速繳納。`
            }),
            logs: ({ context }) => [...context.logs, { type: 'action', text: '📧 準備寄送電子發票...', timestamp: new Date().toISOString() }]
          })
        },
        BACK: 'paymentNarrative'
      }
    },

    sendingEmail: {
      entry: assign({
        currentText: '正在連線至銀行主機... 加密傳輸中...',
        logs: ({ context }) => [...context.logs, { type: 'system', text: '📡 Connecting to SMTP Server...', timestamp: new Date().toISOString() }]
      }),
      invoke: {
        id: 'sendEmailService',
        src: fromPromise(async ({ input }) => {
          const { email, parkingHours } = input;
          // 使用相對路徑，透過 proxy 轉發
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: '迷因停車場 - 繳費通知',
              text: `尊貴的客戶您好，\n\n您在迷因停車場停留了 ${parkingHours} 小時。\n總費用為 NT$ ${parkingHours * 100}。\n\n感謝您的光臨，下次再來！\n\n(此為測試郵件)`,
              html: `
                <div style="font-family: monospace; padding: 20px; background: #0f172a; color: #22d3ee; border: 2px solid #22d3ee; border-radius: 10px;">
                  <h1 style="border-bottom: 1px solid #22d3ee; padding-bottom: 10px;">// MEME PARKING RECEIPT //</h1>
                  <p>尊貴的客戶您好：</p>
                  <p>系統偵測到您的靈魂在迷因停車場停留了 <strong>${parkingHours}</strong> 小時。</p>
                  <p style="font-size: 1.5em; color: #facc15;">總費用: NT$ ${parkingHours * 100}</p>
                  <hr style="border-color: #1e293b;" />
                  <p>感謝您的光臨。請勿在離開時帶走任何旋轉的貓咪。</p>
                  <p style="font-size: 0.8em; color: #94a3b8;">(此為測試郵件 / This is a test email)</p>
                </div>
              `
            })
          });
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        }),
        input: ({ context }) => ({ email: context.email, parkingHours: context.parkingHours }),
        onDone: {
          target: 'finished',
          actions: assign({
            notification: ({ context }) => ({
              title: '繳費成功通知',
              body: `您的停車費已繳納成功。電子發票已寄出。`
            }),
            logs: ({ context }) => [...context.logs, { type: 'success', text: '✅ 繳費成功！收據已寄出', timestamp: new Date().toISOString() }]
          })
        },
        onError: {
          target: 'finished',
          actions: assign({
            logs: ({ context }) => [...context.logs, { type: 'fail', text: '❌ 郵件發送失敗 (但系統還是扣了你的款)', timestamp: new Date().toISOString() }]
          })
        }
      }
    },

    finished: {
      entry: assign({
        currentText: '繳費成功。「很好... 很有精神。」聲音逐漸遠去，你的意識回到了現實世界。(遊戲結束)',
        logs: ({ context }) => [...context.logs, { type: 'success', text: '👋 登出成功', timestamp: new Date().toISOString() }]
      }),
      on: {
        RESTART: {
          target: 'start',
          // 關鍵修改：從正常結局重開，標記 gameCleared = true
          actions: assign({
            gameCleared: true,
            logs: []
          })
        }
      }
    }
  }
});


