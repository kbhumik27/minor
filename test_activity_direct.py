#!/usr/bin/env python3
"""
Direct test of activity prediction without demo mode
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from form_analyzer import FormAnalyzer
import numpy as np

def test_activity_prediction_direct():
    print("Testing Activity Prediction Directly")
    print("=" * 50)
    
    # Initialize form analyzer
    analyzer = FormAnalyzer()
    analyzer.set_mode('normal')
    
    # Test with some sample sensor data that matches the training data format
    test_cases = [
        # Sitting-like data (low movement)
        {
            'ax': 950, 'ay': 120, 'az': 17500, 
            'gx': -150, 'gy': 290, 'gz': -30,
            'name': 'Sitting-like'
        },
        # Standing-like data (moderate movement)
        {
            'ax': 1200, 'ay': 300, 'az': 16800, 
            'gx': -100, 'gy': 150, 'gz': -20,
            'name': 'Standing-like'
        },
        # Walking-like data (higher movement)
        {
            'ax': 1500, 'ay': 800, 'az': 15000, 
            'gx': -200, 'gy': 400, 'gz': -100,
            'name': 'Walking-like'
        },
    ]
    
    print("\nTesting different sensor data patterns:")
    print("-" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing {test_case['name']} data:")
        print(f"   Input: ax={test_case['ax']}, ay={test_case['ay']}, az={test_case['az']}")
        print(f"          gx={test_case['gx']}, gy={test_case['gy']}, gz={test_case['gz']}")
        
        # Call the activity processing directly
        try:
            metrics = analyzer._process_activity_and_steps(test_case)
            if metrics:
                activity = metrics.get('activity', 'unknown')
                confidence = metrics.get('activityConfidence', 0.0)
                print(f"   Result: Activity={activity}, Confidence={confidence:.2f}")
            else:
                print("   Result: No metrics returned")
        except Exception as e:
            print(f"   Error: {e}")
    
    print("\n" + "=" * 50)
    print("Direct activity prediction test completed!")

if __name__ == "__main__":
    test_activity_prediction_direct()
