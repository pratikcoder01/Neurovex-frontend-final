import asyncio
import websockets
import json

async def test_stream():
    uri = "ws://localhost:8000/ws/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            
            # Wait for first message
            message = await websocket.recv()
            data = json.loads(message)
            
            print("Received data payload")
            
            # Verify Status
            status = data.get("status", {})
            channel_count = status.get("channel_count")
            connected = status.get("connected")
            
            print(f"Status: Connected={connected}, Channel Count={channel_count}")
            
            if channel_count == 1:
                print("PASS: Channel count is correct (1)")
            else:
                print(f"FAIL: Channel count is {channel_count}, expected 1")
                
            if connected is True:
                print("PASS: Connected status is True")
            else:
                print(f"FAIL: Connected status is {connected}")

            # Verify Signal
            signal = data.get("signal", [])
            print(f"Signal Length: {len(signal)}")
            
            if len(signal) > 0:
                print("PASS: Signal data received")
            else:
                print("FAIL: No signal data received")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_stream())
