from typing import Dict, Any

class AIEngine:
    def __init__(self):
        pass

    def analyze(self, bands: Dict[str, float]) -> Dict[str, Any]:
        """
        Rule-based Explainable AI to determine cognitive state.
        Returns: {
            "state": str,
            "confidence": float,
            "reason": str
        }
        """
        delta = bands.get("delta", 0)
        theta = bands.get("theta", 0)
        alpha = bands.get("alpha", 0)
        beta  = bands.get("beta", 0)
        gamma = bands.get("gamma", 0)
        
        total_power = sum(bands.values())
        if total_power == 0:
             return {
                "state": "unknown",
                "confidence": 0.0,
                "reason": "No signal detected."
            }
            
        # Relative powers
        rel_alpha = alpha / total_power
        rel_beta = beta / total_power
        rel_theta = theta / total_power
        
        # Focus Rule: High Beta relative to Alpha/Theta
        if rel_beta > 0.4 and rel_beta > rel_alpha:
            confidence = min(rel_beta * 2, 1.0) # Map 0.5->1.0
            return {
                "state": "focus",
                "confidence": round(confidence, 2),
                "reason": f"High Beta ({int(rel_beta*100)}%) activity indicates active concentration."
            }
            
        # Relax Rule: High Alpha dominant
        if rel_alpha > 0.4:
            confidence = min(rel_alpha * 2, 1.0)
            return {
                "state": "relax",
                "confidence": round(confidence, 2),
                "reason": f"Dominant Alpha ({int(rel_alpha*100)}%) waves indicate a calm, wakeful state."
            }
            
        # Fatigue Rule: High Theta
        if rel_theta > 0.35:
            return {
                "state": "fatigue",
                "confidence": round(min(rel_theta*2.5, 1.0), 2),
                "reason": f"Elevated Theta ({int(rel_theta*100)}%) suggests drowsiness or fatigue."
            }
            
        # Stress Rule: High Gamma/High Beta without Focus context (simplified)
        if (gamma / total_power) > 0.3:
             return {
                "state": "stress",
                "confidence": 0.85,
                "reason": "Abnormal Gamma spikes detected, correlating with high stress."
            }
            
        return {
            "state": "neutral",
            "confidence": 0.5,
            "reason": "Balanced spectral power distribution."
        }
