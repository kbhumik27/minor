import { Wifi, WifiOff } from 'lucide-react';

interface DashboardHeaderProps {
  connected: boolean;
}

export const DashboardHeader = ({ connected }: DashboardHeaderProps) => {
  return (
    <header className="dashboard-header mb-8">
      <div className="flex items-center justify-center gap-4 mb-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
          Fitness Dashboard
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
    </header>
  );
};
