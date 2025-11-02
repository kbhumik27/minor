import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import type { SensorData } from '../types';

interface SensorChartProps {
  sensorData: SensorData;
}

interface ChartDataPoint {
  time: string;
  pitch: number;
  roll: number;
  yaw: number;
}

export const SensorChart = ({ sensorData }: SensorChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    const newDataPoint: ChartDataPoint = {
      time: now,
      pitch: sensorData.pitch,
      roll: sensorData.roll,
      yaw: sensorData.yaw,
    };

    setChartData((prev) => {
      const updated = [...prev, newDataPoint];
      return updated.slice(-20); // Keep last 20 data points
    });
  }, [sensorData]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Orientation Chart</h2>
        <div className="text-center text-white/70 py-8">Waiting for data...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Orientation Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="pitch"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            name="Pitch"
          />
          <Line
            type="monotone"
            dataKey="roll"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Roll"
          />
          <Line
            type="monotone"
            dataKey="yaw"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Yaw"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
