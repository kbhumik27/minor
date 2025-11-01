import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Wifi, WifiOff, Heart } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

interface SensorData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  pitch: number;
  roll: number;
  yaw: number;
  heartRate: number;
  pulse: number;
  beatDetected: boolean;
}

const ESP32Monitor = () => {
  const [connected, setConnected] = useState(false);
  const [esp32Url, setEsp32Url] = useState('ws://192.168.1.100:81');
  const [feedback, setFeedback] = useState('');
  
  const [sensorData, setSensorData] = useState<SensorData>({
    ax: 0, ay: 0, az: 0,
    gx: 0, gy: 0, gz: 0,
    pitch: 0, roll: 0, yaw: 0,
    heartRate: 0, pulse: 0,
    beatDetected: false
  });

  const socketRef = useRef<Socket | null>(null);

  const handleSensorData = useCallback((data: SensorData) => {
    setSensorData(data);
  }, []);

  useEffect(() => {
    socketRef.current = io(API_URL);
    
    if (socketRef.current) {
      socketRef.current.on('sensor_data', (data: SensorData) => {
        handleSensorData(data);
      });
      
      socketRef.current.on('esp32_status', (status: any) => {
        setConnected(status.connected);
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [handleSensorData]);

  const connectToESP32 = async () => {
    try {
      await fetch(`${API_URL}/api/connect_esp32`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: esp32Url })
      });
      setFeedback('Connecting...');
    } catch (error) {
      setFeedback('Connection failed');
    }
  };

  const disconnect = async () => {
    try {
      await fetch(`${API_URL}/api/disconnect_esp32`, { method: 'POST' });
      setConnected(false);
      setFeedback('Disconnected');
    } catch (error) {
      setFeedback('Disconnect failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Activity className="w-16 h-16 text-purple-400" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
              ESP32 Monitor
            </h1>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-full backdrop-blur-lg">
              {connected ? (
                <Wifi className="w-8 h-8 text-green-400" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-400" />
              )}
              <span className="text-white font-semibold text-xl">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Panel */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 mb-12 border border-white/20 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-10 text-center">ESP32 Connection</h2>
          <div className="flex flex-col gap-6">
            <input
              type="text"
              value={esp32Url}
              onChange={(e) => setEsp32Url(e.target.value)}
              placeholder="ws://192.168.1.100:81"
              className="w-full px-8 py-6 bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-2xl text-center"
              disabled={connected}
            />
            <div className="flex gap-6 justify-center">
              <button
                onClick={connected ? disconnect : connectToESP32}
                className={`px-12 py-6 rounded-2xl font-bold text-white transition-all text-2xl shadow-lg ${
                  connected 
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
          {feedback && (
            <div className="mt-6 p-4 bg-purple-500/20 rounded-xl text-center">
              <p className="text-white text-lg">{feedback}</p>
            </div>
          )}
        </div>

        {/* Heart Rate */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 mb-12 border border-white/20 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-10 text-center flex items-center justify-center gap-4">
            <Heart className="w-12 h-12 text-red-400" />
            Heart Rate
          </h2>
          <div className="text-center">
            <div className="text-8xl font-bold text-red-400 mb-4">{sensorData.heartRate}</div>
            <div className="text-white/70 text-3xl">BPM</div>
          </div>
        </div>

        {/* Sensor Data */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Accel X</div>
            <div className="text-5xl font-bold text-white">{sensorData.ax.toFixed(2)}</div>
            <div className="text-white/50 text-lg mt-2">g</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Accel Y</div>
            <div className="text-5xl font-bold text-white">{sensorData.ay.toFixed(2)}</div>
            <div className="text-white/50 text-lg mt-2">g</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Accel Z</div>
            <div className="text-5xl font-bold text-white">{sensorData.az.toFixed(2)}</div>
            <div className="text-white/50 text-lg mt-2">g</div>
          </div>
        </div>

        {/* Orientation */}
        <div className="grid grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Pitch</div>
            <div className="text-4xl font-bold text-white">{sensorData.pitch.toFixed(1)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Roll</div>
            <div className="text-4xl font-bold text-white">{sensorData.roll.toFixed(1)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="text-white/70 text-xl mb-4">Yaw</div>
            <div className="text-4xl font-bold text-white">{sensorData.yaw.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESP32Monitor;
