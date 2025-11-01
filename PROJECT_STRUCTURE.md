# 📁 Project Structure

```
ai-fitness-tracker/
├── 📁 backend/                          # Python Flask Backend
│   ├── 🐍 server.py                    # Main Flask application
│   ├── 📄 requirements.txt             # Python dependencies
│   └── 📁 logs/                        # Data logging directory (auto-created)
│
├── 📁 frontend/frontend/                # React Frontend Application
│   ├── 📁 public/                      # Static assets
│   │   ├── 🌐 index.html               # Main HTML template
│   │   └── 🖼️ vite.svg                 # Vite logo
│   │
│   ├── 📁 src/                         # Source code
│   │   ├── ⚛️ App.tsx                   # Main React component
│   │   ├── 🎨 App.css                   # Component-specific styles
│   │   ├── 🎨 index.css                # Global styles & CSS variables
│   │   ├── ⚛️ main.tsx                  # React entry point
│   │   └── 📁 assets/                   # Static assets
│   │
│   ├── ⚙️ package.json                 # npm dependencies & scripts
│   ├── ⚙️ tsconfig.json                # TypeScript configuration
│   ├── ⚙️ tsconfig.app.json            # TypeScript app config
│   ├── ⚙️ tsconfig.node.json           # TypeScript node config
│   ├── ⚙️ vite.config.ts               # Vite build configuration
│   └── ⚙️ eslint.config.js              # ESLint configuration
│
├── 📁 hardware/                         # ESP32 Arduino Code
│   └── 🔧 esp32_fitness_tracker.ino    # Main Arduino sketch
│
├── 📖 README.md                         # Complete project documentation
└── 📄 PROJECT_STRUCTURE.md             # This file
```

## 📋 File Descriptions

### 🐍 Backend Files

| File | Description | Purpose |
|------|-------------|---------|
| `server.py` | Main Flask application | HTTP API, WebSocket server, AI processing |
| `requirements.txt` | Python dependencies | Package management for pip install |
| `logs/` | Data logging directory | Stores CSV files with sensor data |

### ⚛️ Frontend Files

| File | Description | Purpose |
|------|-------------|---------|
| `App.tsx` | Main React component | Dashboard UI, sensor visualization |
| `App.css` | Component styles | Glass morphism, animations, layouts |
| `index.css` | Global styles | CSS variables, base styles, animations |
| `main.tsx` | React entry point | App initialization and rendering |
| `index.html` | HTML template | Base HTML structure, meta tags |
| `package.json` | npm configuration | Dependencies, scripts, project info |
| `vite.config.ts` | Vite configuration | Build settings, dev server, proxy |
| `tsconfig.json` | TypeScript config | Compiler options, type checking |

### 🔧 Hardware Files

| File | Description | Purpose |
|------|-------------|---------|
| `esp32_fitness_tracker.ino` | Arduino sketch | Sensor reading, WebSocket client, OLED display |

### 📖 Documentation Files

| File | Description | Purpose |
|------|-------------|---------|
| `README.md` | Complete project guide | Setup, usage, troubleshooting |
| `PROJECT_STRUCTURE.md` | Project organization | File descriptions and structure |

## 🔄 Data Flow

```
ESP32 Hardware ──► Python Backend ──► React Frontend
      │                    │                  │
      ▼                    ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ • MPU6050   │    │ • Flask API │    │ • Dashboard │
│ • Heart     │    │ • Socket.IO │    │ • Charts    │
│   Rate      │ ──►│ • AI Engine │──► │ • Controls  │
│ • OLED      │    │ • Data Log  │    │ • Stats     │
│ • WebSocket │    │ • WebSocket │    │ • Real-time │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🚀 Getting Started Quick Reference

### 1. Hardware Setup
```bash
# Upload Arduino sketch to ESP32
# Connect MPU6050, Heart Rate sensor, OLED
# Power on and note IP address
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend/frontend
npm install
npm run dev
# Dashboard runs on http://localhost:5174
```

### 4. Connect & Use
```bash
# 1. Open http://localhost:5174 in browser
# 2. Enter ESP32 WebSocket URL: ws://IP:81
# 3. Click Connect
# 4. Calibrate sensors
# 5. Select exercise and start tracking
```

## 🔧 Development Workflow

### Adding New Features

1. **Backend Changes** (`server.py`):
   - Add new API endpoints
   - Modify AI analysis logic
   - Update data processing

2. **Frontend Changes** (`App.tsx`):
   - Add new UI components
   - Update dashboard layout
   - Modify data visualization

3. **Hardware Changes** (`esp32_fitness_tracker.ino`):
   - Add new sensors
   - Modify data collection
   - Update display output

### 🎨 Styling System

The project uses a modern CSS design system with:

- **CSS Variables**: Consistent colors and spacing
- **Glass Morphism**: Backdrop blur effects
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Hover effects and transitions
- **Dark Theme**: Purple accent color scheme

### 🧪 Testing

- **Hardware**: Test sensor accuracy and calibration
- **Backend**: Verify API endpoints and data processing
- **Frontend**: Check responsive design and user interactions
- **Integration**: Test complete data flow from sensors to dashboard

## 📦 Dependencies Overview

### Python Backend
```python
Flask          # Web framework
Flask-SocketIO # Real-time communication
Flask-CORS     # Cross-origin requests
websockets     # ESP32 communication
numpy          # Data processing
asyncio        # Async programming
```

### React Frontend
```json
{
  "react": "^18.3.1",           // UI framework
  "lucide-react": "^0.263.1",   // Icons
  "recharts": "^2.15.4",        // Charts
  "socket.io-client": "^4.8.1", // Real-time data
  "typescript": "^5.0.2",       // Type safety
  "vite": "^4.4.5"             // Build tool
}
```

### Arduino Libraries
```cpp
ESP32           // Board support
MPU6050         // Motion sensor
ArduinoJson     // JSON parsing
Adafruit_SSD1306 // OLED display
WebSockets      // Network communication
```

---

This structure provides a clear separation of concerns:
- **Hardware**: Sensor data collection and device management
- **Backend**: Data processing, AI analysis, and API services  
- **Frontend**: User interface, visualization, and interaction

Each component is designed to be modular and easily extensible for future enhancements.