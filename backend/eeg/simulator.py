import numpy as np
import time
import random

class EEGSimulator:
    def __init__(self, sample_rate=250):
        self.sample_rate = sample_rate
        self.phase = 0.0
        
    def generate_packet(self, duration_sec=1.0, state="neutral"):
        """
        Generates a chunk of EEG data based on the requested state.
        States: 'focus' (High Beta), 'relax' (High Alpha), 'fatigue' (High Theta), 'stress' (High Gamma)
        """
        num_samples = int(self.sample_rate * duration_sec)
        time_steps = np.linspace(0, duration_sec, num_samples, endpoint=False)
        
        # Base noise (1/f noise approximation)
        signal = np.random.normal(0, 2.0, num_samples)
        
        # Add specific bands based on state
        # Delta (0.5-4Hz), Theta (4-8Hz), Alpha (8-13Hz), Beta (13-30Hz), Gamma (30-50Hz)
        
        # Update phase to keep continuity if streamed (simplified for packet gen)
        # For a stateless simulator, we might reset phase or pass it in. 
        # Here we rely on the large time window or just random phases for demo.
        
        if state == "focus":
            # High Beta (15-25Hz), Low Alpha
            signal += 15.0 * np.sin(2 * np.pi * 20 * time_steps) # Beta
            signal += 5.0 * np.sin(2 * np.pi * 10 * time_steps)  # Alpha
            
        elif state == "relax":
            # High Alpha (8-12Hz), Low Beta
            signal += 20.0 * np.sin(2 * np.pi * 10 * time_steps) # Alpha
            signal += 3.0 * np.sin(2 * np.pi * 20 * time_steps)  # Beta
            
        elif state == "fatigue":
            # High Theta (4-8Hz), Low Alpha
            signal += 18.0 * np.sin(2 * np.pi * 6 * time_steps)  # Theta
            signal += 5.0 * np.sin(2 * np.pi * 10 * time_steps)  # Alpha
            
        elif state == "stress":
            # High Gamma (>30Hz), High Beta
            signal += 10.0 * np.sin(2 * np.pi * 40 * time_steps) # Gamma
            signal += 15.0 * np.sin(2 * np.pi * 22 * time_steps) # Beta
        
        # Artifacts (Blinks/Jaw clench) - Random injection
        if num_samples >= 50 and random.random() < 0.05: # 5% chance of artifact
            # Eye blink (high amplitude delta wave)
            blink_start = random.randint(0, num_samples - 50)
            blink_window = np.hanning(50) * 100 # High amp
            signal[blink_start:blink_start+50] += blink_window

        return signal
