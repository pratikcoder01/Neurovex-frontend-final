import numpy as np
from typing import Dict

class EEGProcessor:
    def __init__(self, sample_rate=250):
        self.sample_rate = sample_rate
        self.buffer = np.zeros(sample_rate * 2) # 2-second buffer
        
    def process_chunk(self, chunk: np.ndarray) -> Dict[str, float]:
        """
        Adds new data chunk, updates buffer, runs FFT, returns Band Powers.
        """
        # Roll buffer and add new data
        chunk_len = len(chunk)
        self.buffer = np.roll(self.buffer, -chunk_len)
        self.buffer[-chunk_len:] = chunk
        
        # Compute FFT on the full buffer
        # In a real medical app, we'd apply a bandpass filter (0.5-50Hz) first here.
        
        fft_result = np.fft.rfft(self.buffer)
        freqs = np.fft.rfftfreq(len(self.buffer), 1/self.sample_rate)
        
        # Get magnitude
        magnitudes = np.abs(fft_result)
        
        # Normalize
        magnitudes = magnitudes / len(self.buffer)
        
        # Extract Band Powers (Average magnitude in freq range)
        bands = {
            "delta": self._get_band_power(freqs, magnitudes, 0.5, 4),
            "theta": self._get_band_power(freqs, magnitudes, 4, 8),
            "alpha": self._get_band_power(freqs, magnitudes, 8, 13),
            "beta":  self._get_band_power(freqs, magnitudes, 13, 30),
            "gamma": self._get_band_power(freqs, magnitudes, 30, 50)
        }
        
        return bands

    def _get_band_power(self, freqs, magnitudes, low, high):
        """Calculates average power in a frequency band."""
        # Find indices
        idx = np.logical_and(freqs >= low, freqs <= high)
        if np.sum(idx) == 0:
            return 0.0
        return float(np.mean(magnitudes[idx]))
