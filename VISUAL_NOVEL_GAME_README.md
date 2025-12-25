# 🎮 Visual Novel Smart Parking Game

A retro RPG-style interactive fiction game that simulates a Smart Parking scenario with IoT integration, built with React and XState v5.

## 🌟 Features

### Game Features
- **Visual Novel Interface**: Classic RPG-style dialogue system with typewriter effect
- **QTE System**: Quick Time Event challenges for engine start sequence
- **State Machine**: Powered by XState v5 for robust game flow management
- **Retro Aesthetics**: Pixel art style with CRT effects and retro borders

### IoT Integration
- **Digital Twin Simulation**: Real-time sensor data visualization
- **Protocol Logging**: MQTT, CoAP, and SQL event tracking
- **Distance Sensor**: HC-SR04 ultrasonic sensor simulation
- **Live Dashboard**: 40% split-screen showing IoT debug panel

## 🎯 Game Flow

```
start → inCar → qteSequence → driving → atGate → gateOpening → parked
                     ↓ (fail)
                engineStall
```

### States Description

1. **start**: Introduction scene at parking lot
2. **inCar**: Player enters the car
3. **qteSequence**: Engine start QTE challenge (4 random arrow keys)
4. **engineStall**: QTE failure state (retry available)
5. **driving**: Car moves forward, distance decreases
6. **atGate**: Arrives at parking barrier
7. **gateOpening**: Gate opens with IoT protocols
8. **parked**: Mission complete

## 🕹️ Controls

- **Arrow Keys (↑↓←→)**: QTE sequence input during engine start
- **Mouse Click**: Select dialogue choices

## 🏗️ Technical Architecture

### State Machine (XState v5)
```javascript
visualNovelMachine
├── Context: distance, qteSequence, qteProgress, logs
├── States: 8 game states
└── Services: distanceSimulationService
```

### Custom Hooks
- **useQTE**: Handles keyboard input matching for QTE sequences

### Components
- **VisualNovelUI**: Main game interface
  - DialogueBox: Retro text box with typewriter effect
  - SceneDisplay: Background and character display
  - ChoiceButtons: Interactive choice buttons
  - QTEOverlay: Full-screen QTE challenge UI
- **IoTDebugPanel**: IoT dashboard
  - Status display
  - Sensor graph
  - Protocol logs (MQTT/CoAP/SQL)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The game will open at `http://localhost:3000`

## 📦 Dependencies

```json
{
  "react": "^19.2.3",
  "xstate": "^5.25.0",
  "@xstate/react": "^6.0.0",
  "tailwindcss": "^4.1.18"
}
```

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Visual Novel (60%)        │  IoT Dashboard (40%)       │
│  ┌─────────────────────┐   │  ┌─────────────────────┐   │
│  │  Scene Display      │   │  │  System Status      │   │
│  │  (Background + Char)│   │  │  - State            │   │
│  └─────────────────────┘   │  │  - Timestamp        │   │
│  ┌─────────────────────┐   │  └─────────────────────┘   │
│  │  Dialogue Box       │   │  ┌─────────────────────┐   │
│  │  [Typewriter Text]  │   │  │  Sensor Graph       │   │
│  └─────────────────────┘   │  │  Distance: 500cm    │   │
│  ┌─────────────────────┐   │  └─────────────────────┘   │
│  │  ▶ [Choice Button]  │   │  ┌─────────────────────┐   │
│  └─────────────────────┘   │  │  Protocol Logs      │   │
│                             │  │  [Terminal Style]   │   │
│  (QTE Overlay when active)  │  └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Customization

### Adjust QTE Difficulty
Edit `visualNovelMachine.js`:
```javascript
const generateQTESequence = () => {
  // Change 4 to adjust sequence length
  for (let i = 0; i < 4; i++) {
    sequence.push(arrows[Math.floor(Math.random() * arrows.length)]);
  }
};
```

### Modify Distance Simulation Speed
Edit `distanceSimulationService` in `visualNovelMachine.js`:
```javascript
const interval = setInterval(() => {
  currentDistance -= 10; // Change step size
}, 200); // Change interval (ms)
```

## 📝 Game Events & Logs

The IoT dashboard tracks the following events:
- 🎮 **System**: Game state changes
- 📡 **MQTT**: Message queue telemetry
- 📦 **CoAP**: Constrained application protocol
- 📏 **Sensor**: Distance measurements
- 🎯 **QTE**: Quick time event progress
- ✅ **Action**: Player choices
- 🎉 **Success**: Achievements
- 💀 **Fail**: Error states
- 💾 **SQL**: Database operations

## 🎓 Learning Objectives

This project demonstrates:
1. **XState v5** state machine implementation
2. **React Hooks** for game logic (custom useQTE hook)
3. **IoT Concepts** (MQTT, CoAP, sensor simulation)
4. **Digital Twin** architecture
5. **Tailwind CSS** for rapid UI development
6. **Game Design** patterns (QTE, state management)

## 🐛 Troubleshooting

### QTE not responding
- Make sure the game window is focused
- Check browser console for errors
- Ensure arrow keys are working

### Distance not updating
- Check XState service configuration
- Verify `distanceSimulationService` is properly invoked

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to fork and submit pull requests!

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ using React, XState, and Tailwind CSS**
