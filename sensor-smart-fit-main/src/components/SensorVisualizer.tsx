import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useEffect, useRef } from "react";

interface SensorData {
  ax: number;
  ay: number;
  az: number;
  pitch: number;
  roll: number;
  yaw: number;
}

interface SensorVisualizerProps {
  sensorData: SensorData;
}

const SensorVisualizer = ({ sensorData }: SensorVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas
    ctx.fillStyle = "rgba(31, 41, 55, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw 3D cube representing device orientation
    const size = 80;
    const pitch = (sensorData.pitch * Math.PI) / 180;
    const roll = (sensorData.roll * Math.PI) / 180;
    const yaw = (sensorData.yaw * Math.PI) / 180;

    // Calculate 3D cube vertices
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];

    // Rotate vertices
    const rotatedVertices = vertices.map(([x, y, z]) => {
      // Rotate around X (pitch)
      let y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
      let z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
      
      // Rotate around Y (roll)
      let x1 = x * Math.cos(roll) + z1 * Math.sin(roll);
      let z2 = -x * Math.sin(roll) + z1 * Math.cos(roll);
      
      // Rotate around Z (yaw)
      let x2 = x1 * Math.cos(yaw) - y1 * Math.sin(yaw);
      let y2 = x1 * Math.sin(yaw) + y1 * Math.cos(yaw);

      return [x2 * size + centerX, y2 * size + centerY, z2];
    });

    // Draw cube edges with depth
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back face
      [4, 5], [5, 6], [6, 7], [7, 4], // Front face
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
    ];

    edges.forEach(([start, end]) => {
      const [x1, y1, z1] = rotatedVertices[start];
      const [x2, y2, z2] = rotatedVertices[end];
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `rgba(34, 211, 238, ${0.3 + z1 * 0.3})`);
      gradient.addColorStop(1, `rgba(251, 146, 60, ${0.3 + z2 * 0.3})`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw acceleration vector
    const accelScale = 50;
    const accelX = centerX + sensorData.ax * accelScale;
    const accelY = centerY + sensorData.ay * accelScale;
    
    const accelGradient = ctx.createLinearGradient(centerX, centerY, accelX, accelY);
    accelGradient.addColorStop(0, "rgba(34, 211, 238, 0.8)");
    accelGradient.addColorStop(1, "rgba(34, 211, 238, 0.2)");
    
    ctx.strokeStyle = accelGradient;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(accelX, accelY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(accelY - centerY, accelX - centerX);
    ctx.fillStyle = "rgba(34, 211, 238, 0.8)";
    ctx.beginPath();
    ctx.moveTo(accelX, accelY);
    ctx.lineTo(accelX - 10 * Math.cos(angle - Math.PI / 6), accelY - 10 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(accelX - 10 * Math.cos(angle + Math.PI / 6), accelY - 10 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Draw labels
    ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Acceleration Vector", 20, 30);

  }, [sensorData]);

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-elevated h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          Live Sensor Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas 
          ref={canvasRef} 
          className="w-full h-[400px] rounded-lg bg-secondary/30 animate-data-pulse"
        />
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground mb-1">Accel X</div>
            <div className="font-mono text-primary">{sensorData.ax.toFixed(2)} g</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">Accel Y</div>
            <div className="font-mono text-accent">{sensorData.ay.toFixed(2)} g</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground mb-1">Accel Z</div>
            <div className="font-mono text-success">{sensorData.az.toFixed(2)} g</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SensorVisualizer;
