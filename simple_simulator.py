#!/usr/bin/env python3
"""
Simple EEG Hardware Simulator
"""

import asyncio
import websockets
import json
import time
import random

async def handle_connection(websocket):
    """Handle WebSocket connection"""
    print(f"Client connected from {websocket.remote_address}")
    
    try:
        # Send device info
        await websocket.send(json.dumps({
            "type": "device_info",
            "device": {
                "name": "Neurovex Headband Simulator",
                "type": "websocket",
                "channels": 4,
                "sample_rate": 250
            }
        }))
        
        # Send EEG data
        for i in range(100):  # Send 100 messages
            timestamp = time.time()
            
            # Generate simple EEG data
            channels = [
                random.uniform(-50, 50) for _ in range(4)
            ]
            
            bands = {
                "delta": random.uniform(0.1, 0.5),
                "theta": random.uniform(0.2, 0.8),
                "alpha": random.uniform(0.3, 1.2),
                "beta": random.uniform(0.2, 1.5),
                "gamma": random.uniform(0.1, 0.8)
            }
            
            states = {
                "focus": random.randint(20, 80),
                "stress": random.randint(10, 40),
                "fatigue": random.randint(5, 30)
            }
            
            eeg_data = {
                "timestamp": timestamp,
                "channels": channels,
                "bands": bands,
                "states": states,
                "quality": random.uniform(85, 95)
            }
            
            await websocket.send(json.dumps(eeg_data))
            await asyncio.sleep(0.1)  # 10Hz
            
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    print("Starting Simple EEG Simulator on ws://localhost:8082/eeg")
    
    async with websockets.serve(handle_connection, "localhost", 8082):
        print("Simulator ready!")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
