#!/usr/bin/env python3
"""
Test the step counter with controlled test data
"""
import requests
import json
import time

def test_step_counter_controlled():
    base_url = "http://localhost:5000/api"
    
    print("🧪 CONTROLLED STEP COUNTER TEST")
    print("=" * 45)
    
    try:
        # Set to normal mode
        print("1. Setting to normal mode...")
        requests.post(f"{base_url}/set_mode", json={"mode": "normal"})
        
        # Reset steps
        print("2. Resetting step counter...")
        requests.post(f"{base_url}/reset_steps")
        
        print("3. Current status before test:")
        response = requests.get(f"{base_url}/sensor_data")
        data = response.json()
        print(f"   Steps: {data.get('stepCount', 0)}")
        print(f"   Activity: {data.get('activity', 'unknown')}")
        
        # Generate test steps
        print("\n4. Generating 10 test steps...")
        requests.post(f"{base_url}/test_steps", json={"num_steps": 10, "interval": 0.6})
        
        print("\n📊 Monitoring step detection...")
        print("Time | Steps | Rate/min | Step Detected")
        print("-" * 40)
        
        for i in range(12):  # Monitor for a bit longer than the test
            response = requests.get(f"{base_url}/sensor_data")
            data = response.json()
            
            steps = data.get('stepCount', 0)
            step_rate = data.get('stepRate', 0)
            step_detected = data.get('stepDetected', False)
            
            status = "✅ YES" if step_detected else "⏸️  No"
            
            print(f"{i+1:2}s  | {steps:5} | {step_rate:8} | {status}")
            time.sleep(1)
        
        print("\n" + "=" * 45)
        print("✅ Controlled step counter test completed!")
        print("🌐 Check the dashboard at: http://localhost:5000")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Server not running. Start with: python backend/server.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_step_counter_controlled()
