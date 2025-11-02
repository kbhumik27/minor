import type { SensorData } from '../types';

interface SensorDisplayProps {
  sensorData: SensorData;
}

export const SensorDisplay = ({ sensorData }: SensorDisplayProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Sensor Data</h2>
      
      {/* Accelerometer */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-xl font-semibold text-purple-300 mb-4 text-center">Accelerometer</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Accel X</div>
            <div className="text-4xl font-bold text-white">{sensorData.ax.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">g</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Accel Y</div>
            <div className="text-4xl font-bold text-white">{sensorData.ay.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">g</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Accel Z</div>
            <div className="text-4xl font-bold text-white">{sensorData.az.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">g</div>
          </div>
        </div>
      </div>

      {/* Gyroscope */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-xl font-semibold text-purple-300 mb-4 text-center">Gyroscope</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Gyro X</div>
            <div className="text-4xl font-bold text-white">{sensorData.gx.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">°/s</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Gyro Y</div>
            <div className="text-4xl font-bold text-white">{sensorData.gy.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">°/s</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Gyro Z</div>
            <div className="text-4xl font-bold text-white">{sensorData.gz.toFixed(2)}</div>
            <div className="text-white/50 text-xs mt-1">°/s</div>
          </div>
        </div>
      </div>

      {/* Orientation */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-purple-300 mb-4 text-center">Orientation</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Pitch</div>
            <div className="text-4xl font-bold text-white">{sensorData.pitch.toFixed(1)}</div>
            <div className="text-white/50 text-xs mt-1">°</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Roll</div>
            <div className="text-4xl font-bold text-white">{sensorData.roll.toFixed(1)}</div>
            <div className="text-white/50 text-xs mt-1">°</div>
          </div>
          <div className="text-center">
            <div className="text-white/70 text-sm mb-2">Yaw</div>
            <div className="text-4xl font-bold text-white">{sensorData.yaw.toFixed(1)}</div>
            <div className="text-white/50 text-xs mt-1">°</div>
          </div>
        </div>
      </div>
    </div>
  );
};
