from core.config import get_settings

class SafetyManager:
    def __init__(self):
        self.settings = get_settings()
        self.emergency_stop_triggered = False
        self.last_heartbeat = 0
        
    def validate_signal(self, signal_quality: float) -> bool:
        """
        Ensures signal quality is sufficient for hardware control.
        Medical standard: > 80% quality required for reliable BCI.
        """
        if self.emergency_stop_triggered:
            return False
            
        if signal_quality < 80.0:
            return False
            
        return True
        
    def check_fatigue_lockout(self, fatigue_level: float) -> bool:
        """
        If user is too fatigued, disable dangerous hardware (e.g. car).
        """
        if fatigue_level > 80.0: # High fatigue
            return True # Lockout active
        return False

    def trigger_emergency_stop(self):
        self.emergency_stop_triggered = True
        # Log to audit trail (Supabase) in real impl
        print("!!! EMERGENCY STOP TRIGGERED !!!")
        
    def reset_emergency_stop(self):
        self.emergency_stop_triggered = False
        print("Emergency stop reset.")

    def is_safe_to_actuate(self, command: str, context: dict) -> bool:
        if self.emergency_stop_triggered:
            return False
            
        # Example rule: Don't allow 'accelerate' if 'stress' is high
        if command == "accelerate" and context.get("stress", 0) > 70:
            return False
            
        return True

safety_monitor = SafetyManager()
