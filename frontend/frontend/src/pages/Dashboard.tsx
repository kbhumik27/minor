import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Wifi, WifiOff, PlayCircle, StopCircle } from "lucide-react";
import SensorVisualizer from "@/components/SensorVisualizer";
import RepCounter from "@/components/RepCounter";
import FormFeedback from "@/components/FormFeedback";
import HumanVisualizer from "@/components/HumanVisualizer";
import io from "socket.io-client";

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
  repCount: number;
  exercise: string;
  formScore?: number;
  feedback?: string;
  timestamp: number;
  demoMode?: boolean;
}

const Dashboard = () => {
  const [connected, setConnected] = useState(false);
  const [esp32Url, setEsp32Url] = useState("ws://192.168.1.100:81");
  const [sensorData, setSensorData] = useState<SensorData>({
    ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0,
    pitch: 0, roll: 0, yaw: 0,
    heartRate: 0, pulse: 0, beatDetected: false,
    repCount: 0, exercise: "Ready", timestamp: 0
  });
  const [selectedExercise, setSelectedExercise] = useState("squat");
  const [isLogging, setIsLogging] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to Flask backend via Socket.IO
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to backend");
    });

    socket.on("sensor_data", (data: SensorData) => {
      setSensorData(data);
      setDemoMode(!!data.demoMode);
    });

    socket.on("esp32_status", (status: { connected: boolean; error?: string }) => {
      setConnected(status.connected);
      if (status.error) {
        toast({
          title: "Connection Error",
          description: status.error,
          variant: "destructive",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const handleToggleDemo = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/toggle_demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !demoMode }),
      });
      const data = await response.json();
      
      if (data.status === 'demo_started') {
        toast({
          title: "Demo Mode Enabled",
          description: "Using simulated sensor data",
        });
      } else {
        toast({
          title: "Demo Mode Disabled",
          description: "Returning to normal operation",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not toggle demo mode",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/connect_esp32", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: esp32Url }),
      });
      const data = await response.json();
      toast({
        title: "Connecting...",
        description: `Connecting to ${data.url}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to backend",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("http://localhost:5000/api/disconnect_esp32", {
        method: "POST",
      });
      setConnected(false);
      toast({
        title: "Disconnected",
        description: "ESP32 connection closed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not disconnect",
        variant: "destructive",
      });
    }
  };

  const handleStartWorkout = async () => {
    try {
      await fetch("http://localhost:5000/api/set_exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: selectedExercise }),
      });
      await fetch("http://localhost:5000/api/reset_reps", { method: "POST" });
      toast({
        title: "Workout Started",
        description: `Starting ${selectedExercise} tracking`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start workout",
        variant: "destructive",
      });
    }
  };

  const handleResetReps = async () => {
    try {
      await fetch("http://localhost:5000/api/reset_reps", { method: "POST" });
      toast({
        title: "Reps Reset",
        description: "Rep counter has been reset",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not reset reps",
        variant: "destructive",
      });
    }
  };

  const handleToggleLogging = async () => {
    try {
      const endpoint = isLogging ? "/api/stop_logging" : "/api/start_logging";
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
      });
      const data = await response.json();
      setIsLogging(!isLogging);
      
      if (!isLogging) {
        toast({
          title: "Logging Started",
          description: "Recording workout data",
        });
      } else {
        toast({
          title: "Logging Stopped",
          description: `Saved ${data.data_points} data points`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not toggle logging",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">AI Fitness Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live sensor telemetry & analytics</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <input placeholder="Search metrics, devices..." className="px-3 py-2 rounded-lg bg-secondary/30 border border-white/10 text-sm w-64" />
            </div>
            <Link to="/profile">
              <Button variant="ghost" className="px-3 py-2">
                <User className="w-5 h-5 mr-2" />
                Profile
              </Button>
            </Link>
            <Badge className={`px-3 py-2 ${connected || demoMode ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
              {connected || demoMode ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
              {demoMode ? "Demo Mode" : (connected ? "Connected" : "Disconnected")}
            </Badge>
          </div>
        </div>

        {/* Connection Card */}
        {!connected && !demoMode && (
          <Card className="glass-card mb-8">
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <Label htmlFor="esp32-url">ESP32 WebSocket URL</Label>
                  <Input
                    id="esp32-url"
                    value={esp32Url}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEsp32Url(e.target.value)}
                    placeholder="ws://192.168.1.100:81"
                    className="bg-secondary/50 mt-2"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleConnect} className="bg-gradient-button text-white">
                    <Wifi className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button onClick={handleToggleDemo} className="bg-gradient-button text-white">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Demo Mode
                  </Button>
                  <Button onClick={() => setEsp32Url('')} className="bg-secondary">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {connected && (
          <>
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Form Accuracy</div>
                <div className="text-2xl font-bold text-primary">95%</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Feedback Latency</div>
                <div className="text-2xl font-bold text-accent">Real-time</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Exercises</div>
                <div className="text-2xl font-bold text-success">10+</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-sm text-muted-foreground">Avg Heart Rate</div>
                <div className="text-2xl font-bold text-accent">{sensorData.heartRate || '--'} BPM</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Live Sensor Visualization</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <SensorVisualizer sensorData={sensorData} />
                    <HumanVisualizer 
                      pitch={sensorData.pitch}
                      roll={sensorData.roll}
                      yaw={sensorData.yaw}
                      exercise={sensorData.exercise}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Pitch</div>
                    <div className="text-2xl font-bold">{sensorData.pitch.toFixed(1)}°</div>
                  </div>
                  <div className="glass-card p-4">
                    <div className="text-sm text-muted-foreground">Roll</div>
                    <div className="text-2xl font-bold">{sensorData.roll.toFixed(1)}°</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-4">
                  <h4 className="text-sm text-muted-foreground mb-2">Controls</h4>
                  <div className="space-y-3">
                    <Label htmlFor="exercise">Exercise</Label>
                    <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                      <SelectTrigger id="exercise">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="squat">Squats</SelectItem>
                        <SelectItem value="pushup">Push-ups</SelectItem>
                        <SelectItem value="bicep_curl">Bicep Curls</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button onClick={handleStartWorkout} className="bg-gradient-button text-white flex-1">Start</Button>
                      <Button onClick={handleResetReps} className="bg-secondary">Reset</Button>
                    </div>
                    <Button onClick={handleToggleLogging} className={`w-full ${isLogging ? 'bg-destructive' : 'bg-secondary'}`}>
                      {isLogging ? 'Stop Logging' : 'Start Logging'}
                    </Button>
                    {demoMode ? (
                      <Button onClick={handleToggleDemo} className="w-full bg-secondary">
                        <StopCircle className="w-4 h-4 mr-2" />
                        Exit Demo Mode
                      </Button>
                    ) : (
                      <Button onClick={handleDisconnect} className="w-full bg-secondary">Disconnect</Button>
                    )}
                  </div>
                </div>

                <RepCounter repCount={sensorData.repCount} exercise={sensorData.exercise} />

                <FormFeedback formScore={sensorData.formScore || 0} feedback={sensorData.feedback || 'Ready to start'} />
              </div>
            </div>
          </>
        )}
      </div>
      
      
    </div>
  );
};

export default Dashboard;
