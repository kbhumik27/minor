import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import type { SensorData } from '../types';

const API_URL = 'http://localhost:5000';

export const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({
    ax: 0, ay: 0, az: 0,
    gx: 0, gy: 0, gz: 0,
    pitch: 0, roll: 0, yaw: 0,
    heartRate: 0, pulse: 0,
    beatDetected: false,
  });
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(API_URL);

    if (socketRef.current) {
      socketRef.current.on('sensor_data', (data: SensorData) => {
        setSensorData(data);
      });

      socketRef.current.on('esp32_status', (status: any) => {
        setConnected(status.connected);
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { connected, sensorData, socket: socketRef.current };
};
