# 🎮 文字遊戲版智慧停車場 - 專案文檔

## 📋 專案概述

這是一個**基於漢字網格**的 2D 文字遊戲（Word Game），模擬智慧停車場 Digital Twin 系統。與傳統的圖形遊戲不同，本專案使用**中文字符**作為遊戲元素的視覺表現，類似於經典的 Roguelike 遊戲風格（如 NetHack、ADOM）。

### 🎯 核心特色

1. **文字遊戲美學** - 使用漢字表示所有遊戲元素
2. **IoT 協議模擬** - 完整的 MQTT、CoAP、HC-SR04 物理模擬
3. **後端系統模擬** - SQL、NTP、SMTP、HTTPS 等協議展示
4. **教育價值** - 學習 IoT 架構與網路協議

---

## 🎨 視覺設計

### 字符映射表

| 漢字 | 英文 | 用途 | 顏色 |
|------|------|------|------|
| **牆** | Wall | 邊界牆壁 | 灰色 (#7f8c8d) |
| **人** | Person | 玩家角色 | 粉紅色 (#ff00ff) |
| **車** | Car | 車輛 | 青色 (#00ffff) |
| **桿** | Barrier | 柵欄（關閉） | 紅色 (#ff0000) |
| **開** | Open | 柵欄（開啟） | 綠色 (#00ff00) |
| **停** | Parking | 停車位 | 黃色 (#ffff00) |
| **測** | Sensor | 感測器 | 橙色 (#ffa500) |
| **　** | Empty | 空地 | 黑色 (#000000) |

### 網格規格

- **尺寸**: 20×20 格子
- **每格大小**: 32×32 像素
- **字體**: 'MS Gothic', 'SimHei', monospace
- **字號**: 24px

---

## 🏗️ 技術架構

### 前端結構

```
src/
├── components/
│   ├── GridGame.js              # 文字網格遊戲引擎
│   ├── GridGame.css             # 網格樣式（字符動畫）
│   ├── IoTDebugTerminal.js      # IoT 協議終端
│   └── IoTDebugTerminal.css     # 終端樣式
├── hooks/
│   └── useUltrasonicSensor.js   # HC-SR04 物理模擬
├── stateMachine.js              # XState 狀態機
├── App.js                       # 主應用
└── App.css                      # 全局樣式
```

### 核心組件

#### 1. GridGame.js - 文字遊戲引擎

**功能**：
- 渲染 20×20 漢字網格
- 處理鍵盤輸入（WASD / 方向鍵）
- 碰撞檢測（牆壁、障礙物）
- 計算網格距離（曼哈頓距離 + 歐幾里得轉換）

**關鍵函數**：
```javascript
// 創建地圖
const createInitialMap = () => {
  const map = Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(CHARS.EMPTY)
  );
  // 繪製牆壁、停車位、柵欄、感測器
};

// 計算距離（每格 = 50cm）
const calculateDistance = (pos1, pos2) => {
  const gridDistance = Math.sqrt(dx² + dy²);
  return gridDistance * 50; // 轉換為公分
};
```

**狀態管理**：
- `playerPos`: { x, y } - 玩家位置
- `carPos`: { x, y } - 車輛位置
- `inCar`: boolean - 是否在車內
- `map`: Array<Array<string>> - 地圖網格

---

#### 2. IoTDebugTerminal.js - IoT 協議終端

**顯示模組**：

##### 🔒 HTTPS TLS 握手
模擬完整的 TLS 1.3 握手過程：
```
🔒 ClientHello: TLS 1.3, Cipher Suites
📥 ServerHello: TLS 1.3, Cipher Suite
🔑 Certificate Received: CN=server.example.com
✅ Certificate Verified: Let's Encrypt
🤝 Key Exchange: ECDHE (X25519)
✅ Handshake Finished
```

##### ⏰ NTP 時間同步
連接 `pool.ntp.org` 同步時間：
```javascript
{
  server: 'pool.ntp.org',
  offset: '+2.345 ms',
  synced: '2025-12-24 14:30:45'
}
```

##### 🗄️ SQL 停車記錄表
模擬數據庫查詢：
```sql
SELECT * FROM parking_logs;
```

| ID | License Plate | Entry Time (NTP) | Fee (NT$) |
|----|---------------|------------------|-----------|
| 1  | ABC-1234      | 2025-12-24 10:30:00 | 0.00 |
| 2  | XYZ-5678      | 2025-12-24 09:15:00 | 15.00 |

##### 📡 MQTT 訊息日誌
Topic: `parking/gate/control`
```json
{
  "cmd": "OPEN",
  "timestamp": "2025-12-24T14:30:45.123Z"
}
```

##### 📦 CoAP 封包
模擬 UDP 封包（十六進制顯示）：
```
40 01 3A 4F 75 52 4F 42 53 45 52 56 45 FF 31 32 35
```

結構：
```
[Header] 40 01           # Ver=1, Type=CON, Code=GET
[MsgID]  3A 4F           # Message ID
[Token]  75 52 4F 42...  # Token (8 bytes)
[Option] B2 73 65 6E...  # Uri-Path: "sensor"
[Marker] FF              # Payload marker
[Payload] 31 32 35       # "125" (distance)
```

##### 📡 HC-SR04 超聲波感測器
**物理公式**：
```javascript
// 音速計算
SpeedOfSound = 331.3 + 0.606 * Temperature (m/s)

// 距離計算
Distance (cm) = (Duration_µs * SpeedOfSound_cm/µs) / 2
```

**顯示數據**：
- Distance: 125.34 cm
- Duration: 7303.21 µs
- Temperature: 25 °C
- Speed of Sound: 346.45 m/s

##### 📧 SMTP 收據發送
模擬郵件伺服器通訊：
```
📧 Connecting to mail.server.com:587...
✅ 220 mail.server.com ESMTP Ready
📤 EHLO localhost
✅ 250 OK
📤 MAIL FROM: <noreply@parking.com>
✅ 250 OK
📤 RCPT TO: <user@example.com>
✅ 250 OK
📤 DATA
✅ 354 Start mail input
📧 Sending Receipt... Total Fee: NT$50
✅ 250 OK: Message accepted
🔌 QUIT
```

---

## 🎮 遊戲機制

### 狀態機流程

```
idle (閒置 - 步行模式)
  ↓ [按 F 靠近車輛]
inCar (在車內)
  ↓ [按 Enter 啟動引擎]
startingEngine (啟動中 - QTE)
  ↓ [QTE 成功]
driving (駕駛模式)
  ↓ [距離 < 150cm]
detected (感測器偵測)
  ↓ [自動觸發 MQTT]
gateOpening (柵欄開啟中)
  ↓ [2秒後]
gateOpen (柵欄開啟 - '桿' → '開')
  ↓ [穿過柵欄]
parked (停車成功) ✅
```

### 距離計算邏輯

**網格到實際距離轉換**：
```javascript
// 網格距離（曼哈頓 + 歐幾里得）
const dx = Math.abs(pos2.x - pos1.x);
const dy = Math.abs(pos2.y - pos1.y);
const gridDistance = Math.sqrt(dx * dx + dy * dy);

// 轉換為公分（假設每格 = 50cm）
const distanceInCm = gridDistance * 50;
```

**物理模擬**：
```javascript
// HC-SR04 計算
const temperature = 25; // °C
const speedOfSound = 331.3 + 0.606 * temperature; // m/s
const speedInCmPerUs = speedOfSound * 100 / 1e6; // cm/µs

// 計算來回時間（µs）
const duration = (distanceInCm / speedInCmPerUs) * 2;

// 添加雜訊（±5%）
const noise = (Math.random() - 0.5) * distanceInCm * 0.05;
const measuredDistance = distanceInCm + noise;
```

---

## 🎯 互動流程

### 1. 初始狀態
- 玩家（**人**）在左上角 (2, 2)
- 車輛（**車**）在附近 (4, 4)
- 柵欄（**桿**）在中間 (10, 10)
- 感測器（**測**）在柵欄旁 (10, 9)

### 2. 進入車輛
1. 使用 WASD 移動 **人** 靠近 **車**
2. 當距離 < 100cm 時，提示：「按 F 進入車輛」
3. 按 **F** 鍵 → 觸發 `ENTER_CAR` 事件
4. **人** 消失，控制權轉移到 **車**

### 3. 啟動引擎
1. 在車內按 **Enter** → 觸發 `START_ENGINE_QTE`
2. 完成 QTE 挑戰（5 鍵序列）
3. 成功 → 進入 `driving` 狀態

### 4. 接近柵欄
1. 使用 WASD 移動 **車** 向柵欄
2. 當距離 < 150cm：
   - 右側終端顯示「⚠️ 進入偵測範圍！」
   - CoAP 封包開始更新
3. 當距離 < 50cm：
   - 自動發送 MQTT 指令：`{"cmd":"OPEN"}`
   - 狀態轉為 `detected`

### 5. 柵欄開啟
1. 1 秒後自動觸發 `TRIGGER_GATE`
2. 狀態轉為 `gateOpening`
3. 2 秒後 **桿** 變為 **開**（綠色）
4. 可以通過柵欄

### 6. 停車完成
1. 駛入停車位區域（**停** 字符）
2. 觸發 `DRIVE_THROUGH`
3. 遊戲結束，顯示統計數據

---

## 🔧 開發指南

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm start
# 訪問 http://localhost:3000
```

### 目錄結構

```
iot/
├── src/
│   ├── components/
│   │   ├── GridGame.js           # 20×20 漢字網格引擎
│   │   ├── GridGame.css          # 字符動畫樣式
│   │   ├── IoTDebugTerminal.js   # 協議終端
│   │   └── IoTDebugTerminal.css  # 終端樣式
│   ├── hooks/
│   │   └── useUltrasonicSensor.js # HC-SR04 模擬
│   ├── stateMachine.js           # XState 狀態機
│   ├── App.js                    # 主協調器
│   └── App.css                   # 分屏佈局
├── public/
├── package.json
└── README.md
```

---

## 🎨 樣式亮點

### 字符動畫

**玩家脈衝**：
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

**車輛發光**：
```css
@keyframes glow {
  0%, 100% { 
    text-shadow: 0 0 10px #00ffff;
  }
  50% { 
    text-shadow: 0 0 40px #00ffff;
  }
}
```

**柵欄閃爍**：
```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**開啟旋轉**：
```css
@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 終端主題

- **背景**: 黑色半透明 `rgba(0, 0, 0, 0.95)`
- **邊框**: 綠色發光 `0 0 20px rgba(0, 255, 0, 0.5)`
- **字體**: Courier New (等寬字體)
- **配色**: 經典終端配色（綠色、青色、黃色、紅色）

---

## 📊 性能優化

### 渲染優化

1. **虛擬 DOM** - React 自動批次更新
2. **useCallback** - 避免不必要的函數重建
3. **CSS 動畫** - 使用 GPU 加速（transform, opacity）

### 狀態管理

1. **useReducer** - 集中式狀態管理
2. **事件驅動** - 基於 XState 概念
3. **最小更新** - 只更新變化的網格格子

---

## 🐛 已知限制

1. **網格大小固定** - 20×20 無法調整（可擴展為配置參數）
2. **無存檔功能** - 刷新頁面重置遊戲
3. **單人模式** - 無多人連線功能
4. **移動端未優化** - 需要虛擬方向鍵

---

## 🚀 未來規劃

### v2.1
- [ ] 可配置網格大小
- [ ] 關卡編輯器
- [ ] 多車輛支援

### v2.2
- [ ] WebSocket 真實 MQTT Broker
- [ ] 真實 IoT 設備連接
- [ ] 歷史數據持久化

### v3.0
- [ ] 多人連線模式
- [ ] 3D 視角切換
- [ ] VR 沉浸式體驗

---

## 📚 學習資源

### IoT 協議
- [MQTT 規範](https://mqtt.org/)
- [CoAP RFC 7252](https://tools.ietf.org/html/rfc7252)
- [HC-SR04 數據表](https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf)

### 網路協議
- [SMTP RFC 5321](https://tools.ietf.org/html/rfc5321)
- [NTP RFC 5905](https://tools.ietf.org/html/rfc5905)
- [TLS 1.3 RFC 8446](https://tools.ietf.org/html/rfc8446)

### 遊戲開發
- [Roguelike 開發指南](http://www.roguebasin.com/)
- [Grid-Based Games](https://gamedevelopment.tutsplus.com/tutorials/how-to-make-a-roguelike--cms-22730)

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發流程
```bash
# Fork 並 Clone
git clone https://github.com/your-username/iot-word-game.git

# 創建分支
git checkout -b feature/new-feature

# 提交變更
git commit -m "Add new feature"

# 推送
git push origin feature/new-feature

# 開啟 PR
```

---

## 📄 授權

MIT License

---

**Built with ❤️ by IoT Education Team**  
**Version 2.0 - Word Game Edition**  
**Date: 2025-12-24**
