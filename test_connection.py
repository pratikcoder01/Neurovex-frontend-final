#!/usr/bin/env python3
"""
Test WebSocket connection to Neurovex backend
"""

import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")
            
            # Listen for a few messages
            for i in range(5):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    print(f"📨 Received message {i+1}:")
                    print(f"   Timestamp: {data.get('timestamp')}")
                    print(f"   Bands: {data.get('bands', {})}")
                    print(f"   Analysis: {data.get('analysis', {})}")
                    print(f"   Status: {data.get('status', {})}")
                    print()
                except asyncio.TimeoutError:
                    print(f"⏰ Timeout waiting for message {i+1}")
                    
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    print("Testing WebSocket connection to Neurovex backend...")
    asyncio.run(test_websocket())
