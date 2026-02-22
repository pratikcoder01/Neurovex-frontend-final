/**
 * Neurovex State Management
 * Handles Global App State: User, Device Connection, EEG Data
 */

const StitchState = {
    // Initial State
    data: {
        currentUser: null,
        deviceStatus: 'disconnected', // disconnected, scanning, connecting, connected
        signalQuality: 0, // 0-100%
        batteryLevel: 0, // 0-100%
        brainStates: {
            focus: 0,
            stress: 0,
            fatigue: 0,
            engagement: 0
        },
        eegBands: {
            delta: 0,
            theta: 0,
            alpha: 0,
            beta: 0,
            gamma: 0
        },
        isDemoMode: true,
        isRealHardware: false,
        deviceInfo: null
    },

    listeners: [],

    // Initialize State
    init() {
        // Load from localStorage if needed
        const savedUser = localStorage.getItem('neurovex_user');
        if (savedUser) {
            this.data.currentUser = JSON.parse(savedUser);
        }
        Stitch.log('State', 'Initialized', this.data);
    },

    // Get a value
    get(key) {
        return key ? this.data[key] : this.data;
    },

    // Update state and notify listeners
    update(key, value) {
        if (typeof key === 'object' && key !== null) {
            // Batch update
            Object.keys(key).forEach(k => {
                this.data[k] = key[k];
                this.notifyListeners(k, key[k]);
            });
            return;
        }
        // Single update
        this.data[key] = value;
        this.notifyListeners(key, value);
    },

    // Subscribe to changes
    subscribe(callback) {
        this.listeners.push(callback);
    },

    notifyListeners(key, value) {
        this.listeners.forEach(cb => cb(this.data, key, value));
    },

    // Hardware Simulation Logic
    simulateHardwareCycle() {
        // If we are getting real data from Hardware Interface, don't simulate!
        if (this.data.isRealHardware) {
            console.log("Real hardware connected, skipping simulation");
            return;
        }

        // If we are getting real data from StreamManager (backend), don't simulate!
        if (window.StreamManager && window.StreamManager.isConnected) return;

        if (!this.data.isDemoMode || this.data.deviceStatus !== 'connected') return;

        // Simulate varying brain states
        const time = Date.now() / 1000;

        // Focus fluctuates slowly
        const focus = Math.min(100, Math.max(0, 50 + 30 * Math.sin(time * 0.1) + Stitch.randomGaussian(0, 5)));

        // Stress spikes occasionally
        const stress = Math.min(100, Math.max(0, 20 + 10 * Math.cos(time * 0.2) + (Math.random() > 0.95 ? 40 : 0)));

        this.update('brainStates', {
            focus: Math.round(focus),
            stress: Math.round(stress),
            fatigue: Math.round(30 + 10 * Math.sin(time * 0.05)),
            engagement: Math.round(focus * 0.8 + 10)
        });

        // Simulate Band Powers based on states
        // High Focus = High Beta, Low Theta
        this.update('eegBands', {
            delta: Math.abs(Stitch.randomGaussian(2, 1)),
            theta: Math.abs(Stitch.randomGaussian(4, 2) + (100 - focus) / 20),
            alpha: Math.abs(Stitch.randomGaussian(10, 3) + (100 - stress) / 10),
            beta: Math.abs(Stitch.randomGaussian(15, 4) + focus / 10),
            gamma: Math.abs(Stitch.randomGaussian(5, 2))
        });
    }
};

// Initialize state when loaded
StitchState.init();

// Start simulation loop if in core app
setInterval(() => {
    StitchState.simulateHardwareCycle();
}, 250); // 4Hz update rate for UI

window.StitchState = StitchState;
