#!/usr/bin/env python3
"""
Simple EEG Hardware Simulator
Sends realistic EEG data via WebSocket for testing real hardware mode
"""

import asyncio
import websockets
import json
import time
import random
import math

class EEGHardwareSimulator:
    def __init__(self):
        self.is_running = False
        self.channels = 4
        self.sample_rate = 250
        self.current_state = "neutral"
        
    def generate_eeg_data(self):
        """Generate realistic EEG data"""
        timestamp = time.time()
        
        # Generate base EEG signals with different frequencies
        signals = []
        for ch in range(self.channels):
            # Each channel has slightly different characteristics
            base_freq = 10 + ch * 2  # Alpha range
            signal = 0
            
            # Add different frequency components
            # Delta (0.5-4 Hz)
            signal += math.sin(2 * math.pi * 2 * timestamp) * random.uniform(5, 15)
            
            # Theta (4-8 Hz)
            signal += math.sin(2 * math.pi * 6 * timestamp) * random.uniform(10, 20)
            
            # Alpha (8-13 Hz)
            signal += math.sin(2 * math.pi * base_freq * timestamp) * random.uniform(20, 40)
            
            # Beta (13-30 Hz)
            signal += math.sin(2 * math.pi * 20 * timestamp) * random.uniform(10, 25)
            
            # Gamma (30-50 Hz)
            signal += math.sin(2 * math.pi * 40 * timestamp) * random.uniform(5, 15)
            
            # Add noise
            signal += random.gauss(0, 5)
            
            signals.append(signal)
        
        # Calculate band powers
        bands = self.calculate_band_powers(signals)
        
        # Determine brain state based on band powers
        state, confidence = self.determine_brain_state(bands)
        
        return {
            "timestamp": timestamp,
            "channels": signals,
            "bands": bands,
            "states": {
                "focus": confidence if state == "focus" else random.randint(20, 40),
                "stress": confidence if state == "stress" else random.randint(10, 30),
                "fatigue": confidence if state == "fatigue" else random.randint(5, 20)
            },
            "quality": random.uniform(85, 95),
            "device_info": {
                "name": "Neurovex Simulator",
                "type": "websocket",
                "channels": self.channels,
                "sample_rate": self.sample_rate
            }
        }
    
    def calculate_band_powers(self, signals):
        """Calculate approximate band power from signals"""
        # Simplified band power calculation
        avg_signal = sum(abs(s) for s in signals) / len(signals)
        
        # Simulate band powers based on signal characteristics
        bands = {
            "delta": avg_signal * random.uniform(0.1, 0.3),
            "theta": avg_signal * random.uniform(0.2, 0.4),
            "alpha": avg_signal * random.uniform(0.3, 0.6),
            "beta": avg_signal * random.uniform(0.2, 0.5),
            "gamma": avg_signal * random.uniform(0.1, 0.3)
        }
        
        return bands
    
    def determine_brain_state(self, bands):
        """Determine brain state from band powers"""
        alpha = bands["alpha"]
        beta = bands["beta"]
        theta = bands["theta"]
        
        # Simple heuristics for brain state
        if beta > alpha * 1.2 and beta > theta:
            state = "focus"
            confidence = min(95, int(beta / alpha * 50))
        elif theta > alpha * 1.5:
            state = "fatigue"
            confidence = min(95, int(theta / alpha * 40))
        elif alpha > beta * 1.3:
            state = "relaxed"
            confidence = min(95, int(alpha / beta * 45))
        else:
            state = "neutral"
            confidence = 50
        
        return state, confidence
    
    async def simulate_device(self, websocket, path):
        """Handle WebSocket connection and send data"""
        print(f"Hardware simulator connected to {websocket.remote_address}")
        
        try:
            # Send device info first
            await websocket.send(json.dumps({
                "type": "device_info",
                "device": {
                    "name": "Neurovex Headband Simulator",
                    "type": "websocket",
                    "version": "1.0.0",
                    "channels": self.channels,
                    "sample_rate": self.sample_rate
                }
            }))
            
            # Start sending EEG data
            self.is_running = True
            while self.is_running:
                eeg_data = self.generate_eeg_data()
                await websocket.send(json.dumps(eeg_data))
                await asyncio.sleep(0.1)  # Send at 10Hz for demo purposes
                
        except websockets.exceptions.ConnectionClosed:
            print("Hardware simulator connection closed")
        except Exception as e:
            print(f"Hardware simulator error: {e}")
        finally:
            self.is_running = False

async def main():
    """Start the hardware simulator server"""
    simulator = EEGHardwareSimulator()
    
    print("Starting Neurovex Hardware Simulator...")
    print("WebSocket server will run on ws://localhost:8082/eeg")
    print("Connect to this from the dashboard to test real hardware mode")
    
    # Start WebSocket server
    async def handle_client(websocket, path):
        if path == "/eeg":
            await simulator.simulate_device(websocket, path)
        else:
            await websocket.close(1000, "Path not found")
    
    server = await websockets.serve(handle_client, "localhost", 8082)
    
    print("Hardware simulator ready!")
    print("Dashboard should detect this as real hardware automatically")
    
    try:
        await server.wait_closed()
    except KeyboardInterrupt:
        print("\nShutting down hardware simulator...")
        simulator.is_running = False

if __name__ == "__main__":
    asyncio.run(main())
