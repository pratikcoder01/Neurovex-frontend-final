class RCCar:
    def __init__(self):
        self.speed = 0 # 0-100
        self.direction = "stop" # forward, left, right, reverse, stop
        
    def drive(self, focus_level: int, command: str):
        """
        Drive logic:
        - Speed is proportional to Focus Level.
        - Command (Left/Right) comes from specific EEG patterns (Artifacts/Motor Imagery).
        """
        if focus_level < 30:
            self.stop()
            return
            
        self.speed = focus_level
        self.direction = command
        
    def stop(self):
        self.speed = 0
        self.direction = "stop"
        
    def get_status(self):
        return {
            "device": "rc_car",
            "speed": self.speed,
            "direction": self.direction
        }
