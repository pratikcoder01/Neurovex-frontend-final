from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.websocket import manager
from eeg.simulator import EEGSimulator
from eeg.processor import EEGProcessor
from eeg.ai_engine import AIEngine
from safety.manager import safety_monitor
from supabase_client.service import db_service
from hardware.bulb import SmartBulb
from hardware.car import RCCar
import asyncio
import json
import time
import random

router = APIRouter()

# Instantiate modules
simulator = EEGSimulator()
dsp = EEGProcessor()
ai = AIEngine()
bulb = SmartBulb()
car = RCCar()

@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket, user_id: str = "demo_user"):
    """
    Main WebSocket endpoint.
    Handles EEG Streaming, AI Analysis, Hardware Control, and Data Logging.
    """
    await manager.connect(websocket, user_id)
    
    # Recording State
    recording_session_id = None
    
    try:
        while True:
            # 1. Non-blocking Check for Commands
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                command = json.loads(data)
                
                if command.get("action") == "start_log":
                    recording_session_id = command.get("session_id")
                    print(f"Session Recording Started: {recording_session_id}")
                elif command.get("action") == "stop_log":
                    recording_session_id = None
                    print("Session Recording Stopped")
                    
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                print(f"Command Error: {e}")

            # 2. Simulation Step (10Hz)
            await asyncio.sleep(0.09) 
            
            # Generate & Process Signal
            current_state = "focus" 
            raw_chunk = simulator.generate_packet(duration_sec=0.1, state=current_state)
            band_powers = dsp.process_chunk(raw_chunk)
            ai_result = ai.analyze(band_powers)
            is_safe = safety_monitor.validate_signal(signal_quality=95.0)
            
            # 3. Hardware Control Logic (Backend Decision)
            focus_val = int(ai_result["confidence"] * 100) if ai_result["state"] == "focus" else 30
            
            # Bulb Logic
            bulb.set_brightness(focus_val)
            bulb.set_color_from_state(ai_result["state"])
            
            # Car Logic (Mock Random Direction if focused)
            car_cmd = "stop"
            if focus_val > 60:
                car_cmd = random.choice(["forward", "left", "right"])
            car.drive(focus_val, car_cmd)

            # 4. Log to DB if Recording
            if recording_session_id:
                await db_service.log_eeg_packet(recording_session_id, band_powers, 95.0)
            
            # 5. Send Payload
            payload = {
                "timestamp": time.time(),
                "signal": raw_chunk.tolist(),
                "bands": band_powers,
                "analysis": ai_result,
                "hardware": {
                    "bulb": bulb.get_status(),
                    "car": car.get_status()
                },
                "status": {
                    "connected": True,
                    "recording": bool(recording_session_id),
                    "safety_lock": not is_safe,
                    "channel_count": 1
                }
            }
            
            await manager.send_personal_message(payload, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        print(f"User {user_id} disconnected")
