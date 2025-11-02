"""
Python Backend Server for AI Fitness Tracker
Connects to ESP32, processes data with AI, serves React frontend
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import asyncio
import websockets
import json
import threading
import numpy as np
from collections import deque
from datetime import datetime
import os
from pathlib import Path

# Get the base directory (parent of backend folder)
BASE_DIR = Path(__file__).parent.parent
FRONTEND_BUILD_DIR = BASE_DIR / 'frontend' / 'frontend' / 'dist'
FRONTEND_DEV_DIR = BASE_DIR / 'frontend' / 'frontend'

# Determine if we're in development or production mode
DEV_MODE = os.getenv('FLASK_ENV') == 'development' or not FRONTEND_BUILD_DIR.exists()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global state
sensor_data = {
    'ax': 0, 'ay': 0, 'az': 0,
    'gx': 0, 'gy': 0, 'gz': 0,
    'pitch': 0, 'roll': 0, 'yaw': 0,
    'heartRate': 0, 'pulse': 0,
    'beatDetected': False,
    'repCount': 0,
    'exercise': 'Ready',
    'timestamp': 0
}

sensor_buffer = deque(maxlen=20)  # For AI prediction
connected_to_esp32 = False
esp32_websocket = None
data_log = []
logging_enabled = False
demo_mode = False  # Track if demo mode is active

# AI Model placeholder (load your trained model here)
ai_model = None
form_analyzer = None


from form_analyzer import FormAnalyzer


# Initialize form analyzer
form_analyzer = FormAnalyzer()


async def connect_to_esp32(esp32_url):
    """Connect to ESP32 WebSocket"""
    global connected_to_esp32, esp32_websocket, sensor_data
    
    try:
        async with websockets.connect(esp32_url) as websocket:
            esp32_websocket = websocket
            connected_to_esp32 = True
            print(f"✓ Connected to ESP32: {esp32_url}")
            
            # Notify frontend
            socketio.emit('esp32_status', {'connected': True})
            
            while connected_to_esp32:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    
                    # Update global state
                    sensor_data.update(data)
                    
                    # Add to buffer for AI
                    sensor_buffer.append([
                        data.get('ax', 0), data.get('ay', 0), data.get('az', 0),
                        data.get('gx', 0), data.get('gy', 0), data.get('gz', 0),
                        data.get('pitch', 0), data.get('roll', 0), data.get('yaw', 0)
                    ])
                    
                    # Analyze form
                    if sensor_data.get('exercise') != 'Ready':
                        score, feedback, rep_detected = form_analyzer.analyze(
                            sensor_data.get('exercise', 'squat'),
                            data.get('pitch', 0),
                            data.get('roll', 0)
                        )
                        
                        sensor_data['formScore'] = score
                        sensor_data['feedback'] = ' | '.join(feedback) if feedback else ''
                        
                        # Get mesh data for visualization
                        sensor_data['meshData'] = form_analyzer.get_mesh_data()
                        
                        # Increment rep count if detected
                        if rep_detected:
                            sensor_data['repCount'] = sensor_data.get('repCount', 0) + 1
                    
                    # Broadcast to all connected clients
                    socketio.emit('sensor_data', sensor_data)
                    
                    # Log data if enabled
                    if logging_enabled:
                        log_entry = {
                            'timestamp': datetime.now().isoformat(),
                            **sensor_data
                        }
                        data_log.append(log_entry)
                    
                except asyncio.TimeoutError:
                    continue
                except json.JSONDecodeError as e:
                    print(f"JSON error: {e}")
                    
    except Exception as e:
        connected_to_esp32 = False
        esp32_websocket = None
        print(f"✗ ESP32 connection error: {e}")
        socketio.emit('esp32_status', {'connected': False, 'error': str(e)})


def run_esp32_connection(esp32_url):
    """Run ESP32 connection in separate thread"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(connect_to_esp32(esp32_url))


# REST API Endpoints

@app.route('/')
def index():
    """Serve React app"""
    if DEV_MODE:
        # In dev mode, redirect to Vite dev server or show a message
        return jsonify({
            'message': 'Frontend not built. Run "npm run build" in frontend/frontend directory',
            'dev_mode': True,
            'frontend_dev_url': 'http://localhost:5173'
        })
    else:
        return send_from_directory(str(FRONTEND_BUILD_DIR), 'index.html')


@app.route('/api/status')
def get_status():
    """Get system status"""
    try:
        # Get connected clients count
        rooms = socketio.server.manager.rooms if hasattr(socketio.server, 'manager') else {}
        clients_count = len(rooms.get('/', {}).get('/', set())) if rooms else 0
    except:
        clients_count = 0
    
    return jsonify({
        'esp32_connected': connected_to_esp32,
        'clients_connected': clients_count,
        'logging_enabled': logging_enabled,
        'data_points_logged': len(data_log)
    })


@app.route('/api/sensor_data')
def get_sensor_data():
    """Get current sensor data"""
    return jsonify(sensor_data)


@app.route('/api/connect_esp32', methods=['POST'])
def connect_esp32_endpoint():
    """Connect to ESP32"""
    data = request.json
    esp32_url = data.get('url', 'ws://192.168.1.100:81')
    
    # Start connection in background thread
    thread = threading.Thread(target=run_esp32_connection, args=(esp32_url,))
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'connecting', 'url': esp32_url})


@app.route('/api/disconnect_esp32', methods=['POST'])
def disconnect_esp32():
    """Disconnect from ESP32"""
    global connected_to_esp32
    connected_to_esp32 = False
    return jsonify({'status': 'disconnected'})

@app.route('/api/start_demo', methods=['POST'])
def start_demo():
    """Start demo mode with simulated sensor data"""
    global demo_mode, sensor_data
    
    data = request.json
    exercise = data.get('exercise', 'squat')
    
    # Stop any existing ESP32 connection
    global connected_to_esp32
    connected_to_esp32 = False
    
    # Start demo mode
    demo_mode = True
    result = form_analyzer.start_demo(exercise)
    sensor_data['exercise'] = exercise
    
    # Start demo data generation in background
    def demo_data_generator():
        while demo_mode:
            demo_data = form_analyzer.get_demo_data()
            if demo_data:
                sensor_data.update(demo_data)
                
                # Analyze form
                score, feedback, rep_detected = form_analyzer.analyze(
                    exercise,
                    demo_data['pitch'],
                    demo_data['roll'],
                    demo_data
                )
                
                sensor_data['formScore'] = score
                sensor_data['feedback'] = ' | '.join(feedback) if feedback else ''
                sensor_data['meshData'] = form_analyzer.get_mesh_data()
                
                # Broadcast to clients
                socketio.emit('sensor_data', sensor_data)
            socketio.sleep(0.1)  # Update at 10Hz
    
    socketio.start_background_task(demo_data_generator)
    return jsonify(result)

@app.route('/api/stop_demo', methods=['POST'])
def stop_demo():
    """Stop demo mode"""
    global demo_mode
    demo_mode = False
    result = form_analyzer.stop_demo()
    return jsonify(result)


@app.route('/api/send_command', methods=['POST'])
def send_command():
    """Send command to ESP32"""
    global esp32_websocket
    
    if not esp32_websocket:
        return jsonify({'error': 'Not connected to ESP32'}), 400
    
    data = request.json
    command = data.get('command')
    
    try:
        # Send command to ESP32
        asyncio.run(esp32_websocket.send(json.dumps(command)))
        return jsonify({'status': 'sent'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/start_logging', methods=['POST'])
def start_logging():
    """Start data logging"""
    global logging_enabled, data_log
    logging_enabled = True
    data_log = []
    return jsonify({'status': 'logging_started'})


@app.route('/api/stop_logging', methods=['POST'])
def stop_logging():
    """Stop data logging and save to file"""
    global logging_enabled
    logging_enabled = False
    
    # Save to CSV
    if data_log:
        filename = f'logs/fitness_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        os.makedirs('logs', exist_ok=True)
        
        import csv
        keys = data_log[0].keys()
        with open(filename, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data_log)
        
        return jsonify({
            'status': 'logging_stopped',
            'data_points': len(data_log),
            'filename': filename
        })
    
    return jsonify({'status': 'logging_stopped', 'data_points': 0})


@app.route('/api/reset_reps', methods=['POST'])
def reset_reps():
    """Reset rep counter"""
    global sensor_data
    sensor_data['repCount'] = 0
    form_analyzer.last_rep_count = 0
    
    if esp32_websocket:
        asyncio.run(esp32_websocket.send(json.dumps({'command': 'reset_reps'})))
    
    return jsonify({'status': 'reps_reset'})


@app.route('/api/set_exercise', methods=['POST'])
def set_exercise():
    """Set current exercise"""
    global sensor_data
    data = request.json
    exercise = data.get('exercise', 'Ready')
    
    sensor_data['exercise'] = exercise
    form_analyzer.rep_state = 'up'
    
    if esp32_websocket:
        asyncio.run(esp32_websocket.send(json.dumps({
            'command': 'set_exercise',
            'exercise': exercise
        })))
    
    return jsonify({'status': 'exercise_set', 'exercise': exercise})


# SocketIO Events

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('sensor_data', sensor_data)


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')


@socketio.on('request_data')
def handle_data_request():
    """Handle data request from client"""
    emit('sensor_data', sensor_data)


# Serve static files for React build
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from React build, fallback to index.html for SPA routing"""
    if path.startswith('api/'):
        # Don't serve API routes as static files
        return jsonify({'error': 'API endpoint not found'}), 404
    
    if DEV_MODE:
        return jsonify({
            'message': 'Frontend not built. Run "npm run build" in frontend/frontend directory',
            'dev_mode': True,
            'frontend_dev_url': 'http://localhost:5173'
        })
    
    # Check if the file exists in the build directory
    file_path = FRONTEND_BUILD_DIR / path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(str(FRONTEND_BUILD_DIR), path)
    else:
        # Fallback to index.html for SPA routing (React Router)
        return send_from_directory(str(FRONTEND_BUILD_DIR), 'index.html')


if __name__ == '__main__':
    print("=" * 60)
    print("AI Fitness Tracker - Python Backend Server")
    print("=" * 60)
    
    if DEV_MODE:
        print("\n⚠️  DEVELOPMENT MODE")
        print("Frontend build not found. To serve the frontend:")
        print("  1. Run: cd frontend/frontend && npm run build")
        print("  2. Or use the Vite dev server: npm run dev")
        print("     Then access: http://localhost:5173")
        print(f"     (Backend API will be at: http://localhost:5000)")
    else:
        print("\n✓ Production Mode - Frontend build found")
        print(f"Frontend directory: {FRONTEND_BUILD_DIR}")
    
    print("\nStarting server...")
    print("Backend API: http://localhost:5000")
    if not DEV_MODE:
        print("React Dashboard: http://localhost:5000")
    
    print("\nAPI Endpoints:")
    print("  GET  /api/status - System status")
    print("  GET  /api/sensor_data - Current sensor data")
    print("  POST /api/connect_esp32 - Connect to ESP32")
    print("  POST /api/disconnect_esp32 - Disconnect from ESP32")
    print("  POST /api/send_command - Send command to ESP32")
    print("  POST /api/start_logging - Start data logging")
    print("  POST /api/stop_logging - Stop and save logs")
    print("  POST /api/reset_reps - Reset rep counter")
    print("  POST /api/set_exercise - Set exercise type")
    print("\nWebSocket: Real-time sensor data streaming")
    print("=" * 60)
    print()
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)