#!/usr/bin/env python3
"""
Test script to verify activity prediction integration
"""
import requests
import json
import time

# Test activity prediction with demo mode
def test_activity_prediction():
    base_url = "http://localhost:5000/api"
    
    print("Testing Activity Prediction Integration")
    print("=" * 50)
    
    # Test 1: Get current status
    print("\n1. Getting current status...")
    response = requests.get(f"{base_url}/status")
    print(f"Status: {response.json()}")
    
    # Test 2: Set mode to normal (to use ML model)
    print("\n2. Setting mode to normal (for ML activity prediction)...")
    response = requests.post(f"{base_url}/set_mode", json={"mode": "normal"})
    print(f"Mode set response: {response.json()}")
    
    # Test 3: Start demo mode to generate sensor data
    print("\n3. Starting demo mode...")
    response = requests.post(f"{base_url}/start_demo", json={"exercise": "squat"})
    print(f"Demo start response: {response.json()}")
    
    # Test 4: Check sensor data for activity predictions
    print("\n4. Monitoring activity predictions for 10 seconds...")
    for i in range(10):
        response = requests.get(f"{base_url}/sensor_data")
        data = response.json()
        activity = data.get('activity', 'unknown')
        confidence = data.get('activityConfidence', 0)
        mode = data.get('mode', 'unknown')
        
        print(f"  [{i+1:2}/10] Activity: {activity:12} | Confidence: {confidence:.2f} | Mode: {mode}")
        time.sleep(1)
    
    # Test 5: Switch to workout mode
    print("\n5. Switching to workout mode...")
    response = requests.post(f"{base_url}/set_mode", json={"mode": "workout"})
    print(f"Mode set response: {response.json()}")
    
    # Test 6: Monitor activity in workout mode
    print("\n6. Monitoring activity in workout mode for 5 seconds...")
    for i in range(5):
        response = requests.get(f"{base_url}/sensor_data")
        data = response.json()
        activity = data.get('activity', 'unknown')
        confidence = data.get('activityConfidence', 0)
        mode = data.get('mode', 'unknown')
        
        print(f"  [{i+1}/5] Activity: {activity:12} | Confidence: {confidence:.2f} | Mode: {mode}")
        time.sleep(1)
    
    # Test 7: Stop demo
    print("\n7. Stopping demo...")
    response = requests.post(f"{base_url}/stop_demo")
    print(f"Demo stop response: {response.json()}")
    
    print("\n" + "=" * 50)
    print("Activity prediction integration test completed!")

if __name__ == "__main__":
    try:
        test_activity_prediction()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Make sure the backend is running on http://localhost:5000")
    except Exception as e:
        print(f"Error: {e}")
