#!/usr/bin/env python3
"""
Test the improved step counter logic
"""
import requests
import json
import time

def test_step_counter():
    base_url = "http://localhost:5000/api"
    
    print("🚶 STEP COUNTER TEST")
    print("=" * 40)
    
    try:
        # Set to normal mode for step tracking
        print("1. Setting to normal mode...")
        requests.post(f"{base_url}/set_mode", json={"mode": "normal"})
        
        # Reset steps
        print("2. Resetting step counter...")
        requests.post(f"{base_url}/reset_steps")
        
        # Start demo mode to generate movement data
        print("3. Starting demo mode...")
        requests.post(f"{base_url}/start_demo", json={"exercise": "squat"})
        
        print("\n📊 Monitoring step detection for 15 seconds...")
        print("Time | Steps | Rate/min | Activity | Step Detected")
        print("-" * 55)
        
        for i in range(15):
            response = requests.get(f"{base_url}/sensor_data")
            data = response.json()
            
            steps = data.get('stepCount', 0)
            step_rate = data.get('stepRate', 0)
            activity = data.get('activity', 'unknown')
            step_detected = data.get('stepDetected', False)
            
            status = "✅ YES" if step_detected else "⏸️  No"
            
            print(f"{i+1:2}s  | {steps:5} | {step_rate:8} | {activity:8} | {status}")
            time.sleep(1)
        
        # Stop demo
        requests.post(f"{base_url}/stop_demo")
        
        print("\n" + "=" * 40)
        print("✅ Step counter test completed!")
        print("🌐 Check the dashboard at: http://localhost:5000")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Server not running. Start with: python backend/server.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_step_counter()
