#!/usr/bin/env python3
"""
Simple test script to verify Neurovex backend API endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return False

def test_root():
    """Test root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root Endpoint: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Root Endpoint Failed: {e}")
        return False

def test_session_start():
    """Test session start endpoint"""
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer mock-token-123"
        }
        data = {
            "duration_minutes": 10,
            "focus_mode": "general"
        }
        response = requests.post(f"{BASE_URL}/api/v1/sessions/start", headers=headers, json=data)
        print(f"Session Start: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Session Start Failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Neurovex Backend API...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Root Endpoint", test_root), 
        ("Session Start", test_session_start)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\nTesting {name}...")
        result = test_func()
        results.append((name, result))
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name}: {status}")
    
    all_passed = all(result for _, result in results)
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
