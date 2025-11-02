import { Heart } from 'lucide-react';
import type { SensorData } from '../types';

interface HeartRateMonitorProps {
  sensorData: SensorData;
}

export const HeartRateMonitor = ({ sensorData }: HeartRateMonitorProps) => {
  const heartRate = sensorData.heartRate || 0;
  const beatDetected = sensorData.beatDetected || false;

  return (
    <div className="glass-card p-8 mb-8">
      <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-4">
        <Heart className={`w-10 h-10 text-red-400 ${beatDetected ? 'heart-beat' : ''}`} />
        Heart Rate
      </h2>
      <div className="text-center">
        <div className="text-8xl font-bold text-red-400 mb-4">{heartRate}</div>
        <div className="text-white/70 text-2xl">BPM</div>
        {beatDetected && (
          <div className="mt-4 text-green-400 text-sm animate-pulse">● Beat Detected</div>
        )}
      </div>
    </div>
  );
};
