import { useState } from 'react';
import { api } from '../services/api';

interface ConnectionPanelProps {
  connected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export const ConnectionPanel = ({ connected, onConnectionChange }: ConnectionPanelProps) => {
  const [esp32Url, setEsp32Url] = useState('ws://192.168.1.100:81');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (connected) {
      try {
        setLoading(true);
        await api.disconnectESP32();
        onConnectionChange(false);
        setFeedback('Disconnected');
      } catch (error) {
        setFeedback('Disconnect failed');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        setFeedback('Connecting...');
        await api.connectESP32(esp32Url);
        setFeedback('Connection initiated');
        setTimeout(() => onConnectionChange(true), 1000);
      } catch (error) {
        setFeedback('Connection failed');
        onConnectionChange(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="glass-card p-8 mb-8">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">ESP32 Connection</h2>
      <div className="flex flex-col gap-6">
        <input
          type="text"
          value={esp32Url}
          onChange={(e) => setEsp32Url(e.target.value)}
          placeholder="ws://192.168.1.100:81"
          className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg"
          disabled={connected || loading}
        />
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleConnect}
            disabled={loading}
            className={`px-8 py-4 rounded-xl font-bold text-white transition-all text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              connected
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            {loading ? 'Processing...' : connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        {feedback && (
          <div className="mt-4 p-4 bg-purple-500/20 rounded-xl text-center">
            <p className="text-white">{feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
};
