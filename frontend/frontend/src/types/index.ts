export interface SensorData {
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
  repCount?: number;
  exercise?: string;
  formScore?: number;
  feedback?: string;
  timestamp?: number;
}

export interface SystemStatus {
  esp32_connected: boolean;
  clients_connected: number;
  logging_enabled: boolean;
  data_points_logged: number;
}

export type ExerciseType = 'Ready' | 'squat' | 'pushup' | 'bicep_curl';
