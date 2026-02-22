#!/usr/bin/env python3
"""
Test connection to hardware simulator
"""

import asyncio
import websockets
import json

async def test_simulator():
    uri = "ws://localhost:8082/eeg"
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to Hardware Simulator")
            
            # Listen for a few messages
            for i in range(3):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    print(f"📨 Message {i+1}:")
                    if 'device' in data:
                        print(f"   Device: {data['device']}")
                    else:
                        print(f"   Timestamp: {data.get('timestamp')}")
                        print(f"   Channels: {len(data.get('channels', []))}")
                        print(f"   Bands: {list(data.get('bands', {}).keys())}")
                        print(f"   States: {data.get('states', {})}")
                    print()
                except asyncio.TimeoutError:
                    print(f"⏰ Timeout waiting for message {i+1}")
                    
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    print("Testing Hardware Simulator connection...")
    asyncio.run(test_simulator())
