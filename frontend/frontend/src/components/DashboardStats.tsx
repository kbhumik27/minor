import { Activity, Heart, Target, TrendingUp } from 'lucide-react';
import type { SensorData } from '../types';

interface DashboardStatsProps {
  sensorData: SensorData;
}

export const DashboardStats = ({ sensorData }: DashboardStatsProps) => {
  const stats = [
    {
      label: 'Heart Rate',
      value: sensorData.heartRate || 0,
      unit: 'BPM',
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      label: 'Reps',
      value: sensorData.repCount || 0,
      unit: '',
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Form Score',
      value: sensorData.formScore || 0,
      unit: '%',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Activity',
      value: sensorData.exercise || 'Ready',
      unit: '',
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-1`}>
              {stat.value}
              {stat.unit && <span className="text-lg ml-1">{stat.unit}</span>}
            </div>
            <div className="text-white/70 text-sm">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};
