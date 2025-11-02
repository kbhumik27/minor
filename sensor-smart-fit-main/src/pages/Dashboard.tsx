import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, Heart, TrendingUp, User, Wifi, WifiOff, 
  Play, Pause, RotateCcw, Save 
} from "lucide-react";
import SensorVisualizer from "@/components/SensorVisualizer";
import HumanVisualizer from "@/components/HumanVisualizer";
import RepCounter from "@/components/RepCounter";
import FormFeedback from "@/components/FormFeedback";
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
  meshData?: {
    joints: {
      [key: string]: {
        position: { x: number; y: number; z: number };
        children: string[];
        name: string;
      };
    };
  };
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
  const { toast } = useToast();

  useEffect(() => {
    // Connect to Flask backend via Socket.IO
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("Connected to backend");
    });

    socket.on("sensor_data", (data: SensorData) => {
      setSensorData(data);
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

  const handleStartDemo = async (exercise: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/start_demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise }),
      });
      const data = await response.json();
      setConnected(true);
      toast({
        title: "Demo Mode Started",
        description: `Running ${exercise} simulation`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start demo mode",
        variant: "destructive",
      });
    }
  };

  const handleStopDemo = async () => {
    try {
      await fetch("http://localhost:5000/api/stop_demo", {
        method: "POST",
      });
      setConnected(false);
      toast({
        title: "Demo Mode Stopped",
        description: "Demo simulation ended",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not stop demo mode",
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img src="/favicon.ico" alt="logo" className="w-12 h-12 md:w-16 md:h-16" />
            <div>
              <h1 className="text-4xl font-bold mb-2">AI Fitness Trainer</h1>
              <p className="text-muted-foreground">Real-time form analysis and rep counting</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/profile">
              <Button variant="outline" className="border-primary/50">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Badge className={`px-4 py-2 ${connected ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
              {connected ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />}
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Connection Card */}
        {!connected && (
          <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-elevated mb-8">
            <CardHeader>
              <CardTitle>Connect to ESP32</CardTitle>
              <CardDescription>Enter your ESP32 WebSocket URL to start tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="esp32-url">ESP32 WebSocket URL</Label>
                  <Input
                    id="esp32-url"
                    value={esp32Url}
                    onChange={(e) => setEsp32Url(e.target.value)}
                    placeholder="ws://192.168.1.100:81"
                    className="bg-secondary/50 mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex gap-2">
                    <Button onClick={handleConnect} className="bg-gradient-primary hover:shadow-glow">
                      <Wifi className="w-4 h-4 mr-2" />
                      Connect ESP32
                    </Button>
                    <Button 
                      onClick={() => handleStartDemo("squat")} 
                      variant="outline" 
                      className="border-accent/50 hover:border-accent"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Start Demo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {connected && (
          <>
            {/* Controls */}
            <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-elevated mb-8">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="exercise">Exercise Type</Label>
                    <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                      <SelectTrigger id="exercise" className="bg-secondary/50 mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="squat">Squats</SelectItem>
                        <SelectItem value="pushup">Push-ups</SelectItem>
                        <SelectItem value="bicep_curl">Bicep Curls</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleStartWorkout} className="bg-gradient-success hover:shadow-glow">
                    <Play className="w-4 h-4 mr-2" />
                    Start Workout
                  </Button>
                  <Button onClick={handleResetReps} variant="outline" className="border-accent/50">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Reps
                  </Button>
                  <Button 
                    onClick={handleToggleLogging} 
                    variant={isLogging ? "destructive" : "outline"}
                    className={!isLogging ? "border-primary/50" : ""}
                  >
                    {isLogging ? <Pause className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {isLogging ? "Stop Logging" : "Start Logging"}
                  </Button>
                  <Button 
                    onClick={() => {
                      handleDisconnect();
                      handleStopDemo();
                    }} 
                    variant="outline" 
                    className="border-destructive/50"
                  >
                    <WifiOff className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Dashboard Grid */}
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Visualizers */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-4">
                    <CardTitle className="mb-4">Sensor Data</CardTitle>
                    <SensorVisualizer sensorData={sensorData} />
                  </Card>
                  <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-4">
                    <CardTitle className="mb-4">3D Visualization</CardTitle>
                    <HumanVisualizer 
                      meshData={sensorData.meshData}
                      exercise={sensorData.exercise}
                    />
                  </Card>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-6">
                <RepCounter 
                  repCount={sensorData.repCount} 
                  exercise={sensorData.exercise}
                />
                
                <Card className="bg-card/80 backdrop-blur-xl border-border/50 hover:shadow-glow transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-accent animate-pulse" />
                      Heart Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-accent mb-2">
                      {sensorData.heartRate} <span className="text-xl text-muted-foreground">BPM</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pulse: {sensorData.pulse}
                    </div>
                  </CardContent>
                </Card>

                <FormFeedback 
                  formScore={sensorData.formScore || 0}
                  feedback={sensorData.feedback || "Ready to start"}
                />
              </div>
            </div>

            {/* Sensor Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Pitch</div>
                  <div className="text-2xl font-bold text-primary">{sensorData.pitch.toFixed(1)}°</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Roll</div>
                  <div className="text-2xl font-bold text-accent">{sensorData.roll.toFixed(1)}°</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Yaw</div>
                  <div className="text-2xl font-bold text-success">{sensorData.yaw.toFixed(1)}°</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-xl border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Accel Z</div>
                  <div className="text-2xl font-bold text-primary">{sensorData.az.toFixed(2)} g</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
