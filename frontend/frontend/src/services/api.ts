import type { ExerciseType } from '../types';

// Auto-detect API URL based on environment
const API_URL = import.meta.env.PROD 
  ? '' // In production, use relative URLs (same origin)
  : 'http://localhost:5000'; // In development, use absolute URL

export const api = {
  async connectESP32(url: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/connect_esp32`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error('Connection failed');
  },

  async disconnectESP32(): Promise<void> {
    const response = await fetch(`${API_URL}/api/disconnect_esp32`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Disconnect failed');
  },

  async getStatus() {
    const response = await fetch(`${API_URL}/api/status`);
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  },

  async getSensorData() {
    const response = await fetch(`${API_URL}/api/sensor_data`);
    if (!response.ok) throw new Error('Failed to fetch sensor data');
    return response.json();
  },

  async startLogging(): Promise<void> {
    const response = await fetch(`${API_URL}/api/start_logging`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start logging');
  },

  async stopLogging() {
    const response = await fetch(`${API_URL}/api/stop_logging`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop logging');
    return response.json();
  },

  async resetReps(): Promise<void> {
    const response = await fetch(`${API_URL}/api/reset_reps`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reset reps');
  },

  async setExercise(exercise: ExerciseType): Promise<void> {
    const response = await fetch(`${API_URL}/api/set_exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise }),
    });
    if (!response.ok) throw new Error('Failed to set exercise');
  },
};

export default api;
