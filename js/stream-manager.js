/**
 * Neurovex Stream Manager
 * Handles WebSocket connection to the backend.
 * Dispatches updates to StitchState.
 */

class StreamManager {
    constructor(url = 'ws://localhost:8000/ws/stream') {
        this.url = url;
        this.socket = null;
        this.isConnected = false;
        this.reconnectInterval = 3000;

        this.connect();
    }

    connect() {
        console.log(`Connecting to Neurovex Backend: ${this.url}`);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("Neurovex Stream Connected");
            this.isConnected = true;
            
            // Update state to show connection
            if (window.StitchState) {
                window.StitchState.update({
                    deviceStatus: 'connected',
                    channelCount: 1
                });
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                this.handleData(payload);
            } catch (e) {
                console.error("Invalid Stream Payload", e);
            }
        };

        this.socket.onclose = () => {
            console.warn("Neurovex Stream Disconnected. Retrying...");
            this.isConnected = false;
            
            // Update state to show disconnection
            if (window.StitchState) {
                window.StitchState.update({
                    deviceStatus: 'disconnected',
                    channelCount: 0
                });
            }
            
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.socket.onerror = (err) => {
            console.error("WebSocket Error:", err);
            this.socket.close();
        };
    }

    handleData(data) {
        console.log("Received WebSocket data:", data);
        
        // Check if we have real hardware connected
        const hasRealHardware = window.HardwareInterface && window.HardwareInterface.isRealHardwareConnected();
        
        // Expected Data Structure from Backend:
        // {
        //   timestamp: float,
        //   bands: { delta, theta, alpha, beta, gamma },
        //   analysis: { state, confidence, reason },
        //   status: { connected, safety_lock }
        // }

        if (window.StitchState) {
            // Update Global State
            const bands = data.bands || {};
            const analysis = data.analysis || {};

            // Only use backend data if no real hardware is connected
            if (!hasRealHardware) {
                window.StitchState.update({
                    brainStates: {
                        focus: analysis.state === 'focus' ? Math.round(analysis.confidence * 100) : 30, // mapping logic
                        stress: analysis.state === 'stress' ? Math.round(analysis.confidence * 100) : 20,
                        fatigue: analysis.state === 'fatigue' ? Math.round(analysis.confidence * 100) : 10
                    },
                    eegBands: {
                        delta: bands.delta || 0,
                        theta: bands.theta || 0,
                        alpha: bands.alpha || 0,
                        beta: bands.beta || 0,
                        gamma: bands.gamma || 0
                    },
                    hardware: data.hardware || {},
                    // [NEW] Raw Signal for Visualization
                    rawSignal: data.signal || [],
                    // [NEW] Status
                    channelCount: data.status?.channel_count || 0,
                    deviceStatus: data.status?.connected ? 'connected' : 'disconnected',
                    isRealHardware: false
                });
            } else {
                // Real hardware is connected, don't override with backend simulation
                console.log("Real hardware detected, using hardware data instead of backend simulation");
            }
        }
    }
}

// Initialize
const streamManager = new StreamManager();
window.StreamManager = streamManager;
