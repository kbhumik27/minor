import { Heart } from 'lucide-react';
import type { SensorData } from '../types';

interface HeartRateMonitorProps {
  sensorData: SensorData;
}

export const HeartRateMonitor = ({ sensorData }: HeartRateMonitorProps) => {
  const heartRate = sensorData.heartRate || 0;
  const beatDetected = sensorData.beatDetected || false;

  // Calculate heart rate zone
  const getHeartRateZone = (hr: number) => {
    if (hr < 100) return { zone: 'Resting', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (hr < 120) return { zone: 'Light', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (hr < 140) return { zone: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { zone: 'Vigorous', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const zone = getHeartRateZone(heartRate);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Heart className={`w-5 h-5 text-red-400 ${beatDetected ? 'heart-beat' : ''}`} />
        Heart Rate Monitor
      </h3>
      <div className="text-center space-y-4">
        <div>
          <div className="text-6xl font-bold text-red-400 mb-2">{heartRate}</div>
          <div className="text-white/70 text-lg">BPM</div>
        </div>
        
        {/* Heart Rate Zone Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${zone.bg} ${zone.color} text-sm font-semibold`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          {zone.zone} Zone
        </div>

        {/* Beat Detection Indicator */}
        {beatDetected && (
          <div className="text-green-400 text-xs font-medium flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
            Beat Detected
          </div>
        )}

        {/* Pulse Value */}
        <div className="text-xs text-white/50 mt-2">
          Pulse Signal: {sensorData.pulse || 0}
        </div>
      </div>
    </div>
  );
};
