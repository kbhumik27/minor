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

app = Flask(__name__, static_folder='build')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

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

# AI Model placeholder (load your trained model here)
ai_model = None
form_analyzer = None


class FormAnalyzer:
    """Real-time form analysis"""
    
    def __init__(self):
        self.thresholds = {
            'squat': {'min_depth': -40, 'max_roll': 15},
            'pushup': {'min_depth': 20, 'max_roll': 15},
            'bicep_curl': {'min_curl': 60, 'max_roll': 10}
        }
        self.rep_state = 'up'
        self.last_rep_count = 0
    
    def analyze(self, exercise, pitch, roll):
        """Analyze form and detect reps"""
        score = 100
        feedback = []
        rep_detected = False
        
        if exercise == 'squat':
            score, feedback, rep_detected = self._analyze_squat(pitch, roll)
        elif exercise == 'pushup':
            score, feedback, rep_detected = self._analyze_pushup(pitch, roll)
        elif exercise == 'bicep_curl':
            score, feedback, rep_detected = self._analyze_bicep_curl(pitch, roll)
        
        return score, feedback, rep_detected
    
    def _analyze_squat(self, pitch, roll):
        score = 100
        feedback = []
        rep_detected = False
        
        # Detect downward phase
        if self.rep_state == 'up' and pitch < -30:
            self.rep_state = 'down'
            if pitch < -50:
                feedback.append("🎯 Perfect depth!")
                score = 100
            elif pitch < -40:
                feedback.append("✓ Good depth")
                score = 90
            else:
                feedback.append("⚠ Go deeper")
                score = 70
        
        # Detect upward phase (rep complete)
        elif self.rep_state == 'down' and pitch > -10:
            self.rep_state = 'up'
            rep_detected = True
            feedback.append("✓ Rep complete!")
        
        # Check alignment
        if abs(roll) > self.thresholds['squat']['max_roll']:
            score -= 20
            feedback.append("⚠ Keep back straight")
        
        return score, feedback, rep_detected
    
    def _analyze_pushup(self, pitch, roll):
        score = 100
        feedback = []
        rep_detected = False
        
        if self.rep_state == 'up' and pitch > 20:
            self.rep_state = 'down'
            if abs(roll) > 15:
                feedback.append("⚠ Align shoulders")
                score = 70
            else:
                feedback.append("💪 Good form!")
                score = 95
        
        elif self.rep_state == 'down' and pitch < 5:
            self.rep_state = 'up'
            rep_detected = True
            feedback.append("✓ Rep complete!")
        
        return score, feedback, rep_detected
    
    def _analyze_bicep_curl(self, pitch, roll):
        score = 100
        feedback = []
        rep_detected = False
        
        if self.rep_state == 'down' and pitch > 60:
            self.rep_state = 'up'
            feedback.append("💪 Full contraction!")
            score = 95
        
        elif self.rep_state == 'up' and pitch < 20:
            self.rep_state = 'down'
            rep_detected = True
            feedback.append("✓ Rep complete!")
        
        if abs(roll) > 10:
            score -= 20
            feedback.append("⚠ Stabilize forearm")
        
        return score, feedback, rep_detected


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
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/status')
def get_status():
    """Get system status"""
    return jsonify({
        'esp32_connected': connected_to_esp32,
        'clients_connected': len(socketio.server.manager.rooms.get('/', {}).get('/', set())),
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
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    print("=" * 60)
    print("AI Fitness Tracker - Python Backend Server")
    print("=" * 60)
    print("\nStarting server...")
    print("Backend API: http://localhost:5000")
    print("React Dashboard: http://localhost:5000")
    print("\nEndpoints:")
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