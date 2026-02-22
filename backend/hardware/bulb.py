class SmartBulb:
    def __init__(self):
        self.brightness = 0
        self.color = "warm" # warm, cool, rgb
        self.state = "off"
        
    def set_brightness(self, level: int):
        """Sets brightness 0-100 based on Focus Level"""
        self.brightness = max(0, min(100, level))
        if self.brightness > 0:
            self.state = "on"
        else:
            self.state = "off"
            
    def set_color_from_state(self, state: str):
        """
        Focus -> Cool White (Productivity)
        Relax -> Warm Amber (Calm)
        Stress -> Red (Warning)
        """
        if state == "focus":
            self.color = "cool_white"
        elif state == "relax":
            self.color = "warm_amber"
        elif state == "stress":
            self.color = "red"
            
    def get_status(self):
        return {
            "device": "smart_bulb",
            "state": self.state,
            "brightness": self.brightness,
            "color": self.color
        }
