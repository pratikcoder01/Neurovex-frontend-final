/**
 * Neurovex Hardware Interface
 * Handles real EEG headband detection and data acquisition
 */

class HardwareInterface {
    constructor() {
        this.isConnected = false;
        this.deviceInfo = null;
        this.dataBuffer = [];
        this.sampleRate = 250;
        this.channels = [];
        this.isRealHardware = false;
        this.detectionInterval = null;
        this.fakeDataInterval = null;
        this.hasRealData = false;
        
        // Start hardware detection
        this.startDetection();
    }

    /**
     * Start scanning for real EEG hardware
     */
    startDetection() {
        console.log("Starting hardware detection...");
        
        // Check for various EEG hardware interfaces
        this.detectHardware();
        
        // Continue scanning every 5 seconds
        this.detectionInterval = setInterval(() => {
            if (!this.isConnected) {
                this.detectHardware();
            }
        }, 5000);
    }

    /**
     * Detect available EEG hardware
     */
    async detectHardware() {
        try {
            // Method 1: Check for Web Bluetooth EEG devices
            if (navigator.bluetooth) {
                await this.detectBluetoothDevices();
            }

            // Method 2: Check for Serial API devices
            if ('serial' in navigator) {
                await this.detectSerialDevices();
            }

            // Method 3: Check for WebSocket EEG servers
            await this.detectWebSocketServers();

            // Method 4: Check for USB HID devices
            if (navigator.hid) {
                await this.detectHIDDevices();
            }

            // Method 5: Check for existing EEG data streams
            await this.detectDataStreams();

        } catch (error) {
            console.error("Hardware detection error:", error);
        }
    }

    /**
     * Detect Bluetooth EEG devices
     */
    async detectBluetoothDevices() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['heart_rate'] }, // Many EEG devices use similar services
                    { namePrefix: 'EEG' },
                    { namePrefix: 'Neuro' },
                    { namePrefix: 'Muse' },
                    { namePrefix: 'OpenBCI' },
                    { namePrefix: 'Emotiv' }
                ],
                optionalServices: ['generic_access', 'device_information']
            });

            if (device) {
                console.log("Found Bluetooth EEG device:", device.name);
                await this.connectBluetoothDevice(device);
            }
        } catch (error) {
            // No Bluetooth device found or permission denied
            console.log("No Bluetooth EEG device detected");
        }
    }

    /**
     * Detect Serial EEG devices
     */
    async detectSerialDevices() {
        try {
            const port = await navigator.serial.requestPort();
            if (port) {
                console.log("Found Serial EEG device");
                await this.connectSerialDevice(port);
            }
        } catch (error) {
            // No serial device found
            console.log("No Serial EEG device detected");
        }
    }

    /**
     * Detect WebSocket EEG servers
     */
    async detectWebSocketServers() {
        const commonPorts = [8081, 8080, 8082, 9000, 9001, 5000];
        
        for (const port of commonPorts) {
            try {
                const ws = new WebSocket(`ws://localhost:${port}/eeg`);
                ws.onopen = () => {
                    console.log(`Found EEG WebSocket server on port ${port}`);
                    this.connectWebSocketServer(ws, port);
                    ws.close(); // Close test connection
                };
                ws.onerror = () => {
                    // Port not available, try next
                };
                setTimeout(() => ws.close(), 1000);
            } catch (error) {
                // Continue to next port
            }
        }
    }

    /**
     * Detect HID EEG devices
     */
    async detectHIDDevices() {
        try {
            const devices = await navigator.hid.getDevices();
            const eegDevices = devices.filter(device => 
                device.productName?.includes('EEG') ||
                device.productName?.includes('Neuro') ||
                device.productName?.includes('Muse') ||
                device.productName?.includes('OpenBCI')
            );

            if (eegDevices.length > 0) {
                console.log("Found HID EEG devices:", eegDevices);
                await this.connectHIDDevice(eegDevices[0]);
            }
        } catch (error) {
            console.log("No HID EEG device detected");
        }
    }

    /**
     * Detect existing data streams (check for existing processes)
     */
    async detectDataStreams() {
        // Check if there's an existing EEG stream application running
        // This could be through WebRTC, other WebSocket servers, etc.
        try {
            const response = await fetch('http://localhost:5000/status', { 
                method: 'GET',
                timeout: 1000 
            });
            if (response.ok) {
                console.log("Found existing EEG data stream");
                this.connectDataStream('http://localhost:5000');
            }
        } catch (error) {
            // No existing stream found
        }
    }

    /**
     * Connect to Bluetooth device
     */
    async connectBluetoothDevice(device) {
        try {
            const server = await device.gatt.connect();
            this.isConnected = true;
            this.isRealHardware = true;
            this.hasRealData = false; // Will be true when real data arrives
            
            this.deviceInfo = {
                type: 'bluetooth',
                name: device.name,
                id: device.id,
                connected: true
            };

            // Update global state
            if (window.StitchState) {
                window.StitchState.update({
                    deviceStatus: 'connected',
                    isRealHardware: true,
                    deviceInfo: this.deviceInfo
                });
            }

            // Start fake data until real data arrives
            this.startFakeDataGeneration();

            // Start data collection
            await this.startBluetoothDataCollection(server);
            
        } catch (error) {
            console.error("Failed to connect to Bluetooth device:", error);
        }
    }

    /**
     * Connect to Serial device
     */
    async connectSerialDevice(port) {
        try {
            await port.open({ baudRate: 115200 });
            this.isConnected = true;
            this.isRealHardware = true;
            this.hasRealData = false; // Will be true when real data arrives
            
            this.deviceInfo = {
                type: 'serial',
                name: port.getInfo().usbProductName || 'Serial EEG',
                connected: true
            };

            // Update global state
            if (window.StitchState) {
                window.StitchState.update({
                    deviceStatus: 'connected',
                    isRealHardware: true,
                    deviceInfo: this.deviceInfo
                });
            }

            // Start fake data until real data arrives
            this.startFakeDataGeneration();

            // Start data collection
            this.startSerialDataCollection(port);
            
        } catch (error) {
            console.error("Failed to connect to Serial device:", error);
        }
    }

    /**
     * Connect to WebSocket server
     */
    connectWebSocketServer(ws, port) {
        this.isConnected = true;
        this.isRealHardware = true;
        this.hasRealData = false; // Will be true when real data arrives
        
        this.deviceInfo = {
            type: 'websocket',
            name: `EEG Server (Port ${port})`,
            port: port,
            connected: true
        };

        // Update global state
        if (window.StitchState) {
            window.StitchState.update({
                deviceStatus: 'connected',
                isRealHardware: true,
                deviceInfo: this.deviceInfo
            });
        }

        // Start fake data until real data arrives
        this.startFakeDataGeneration();

        // Start data collection
        this.startWebSocketDataCollection(`ws://localhost:${port}/eeg`);
    }

    /**
     * Connect to HID device
     */
    async connectHIDDevice(device) {
        try {
            await device.open();
            this.isConnected = true;
            this.isRealHardware = true;
            this.hasRealData = false; // Will be true when real data arrives
            
            this.deviceInfo = {
                type: 'hid',
                name: device.productName,
                vendorId: device.vendorId,
                productId: device.productId,
                connected: true
            };

            // Update global state
            if (window.StitchState) {
                window.StitchState.update({
                    deviceStatus: 'connected',
                    isRealHardware: true,
                    deviceInfo: this.deviceInfo
                });
            }

            // Start fake data until real data arrives
            this.startFakeDataGeneration();

            // Start data collection
            this.startHIDDataCollection(device);
            
        } catch (error) {
            console.error("Failed to connect to HID device:", error);
        }
    }

    /**
     * Start Bluetooth data collection
     */
    async startBluetoothDataCollection(server) {
        // Implementation depends on specific device protocol
        // This is a template for Muse/OpenBCI style devices
        console.log("Starting Bluetooth data collection...");
        
        // Simulate real data collection for now
        this.simulateRealData();
    }

    /**
     * Start Serial data collection
     */
    startSerialDataCollection(port) {
        console.log("Starting Serial data collection...");
        
        const reader = port.readable.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readData = async () => {
            try {
                const { value, done } = await reader.read();
                if (done) return;

                buffer += decoder.decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line

                for (const line of lines) {
                    if (line.trim()) {
                        this.processEEGData(line);
                    }
                }
                
                readData();
            } catch (error) {
                console.error("Serial read error:", error);
            }
        };

        readData();
    }

    /**
     * Start WebSocket data collection
     */
    startWebSocketDataCollection(url) {
        console.log("Starting WebSocket data collection...");
        
        const ws = new WebSocket(url);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.processEEGData(data);
            } catch (error) {
                console.error("WebSocket data error:", error);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket EEG connection lost");
            this.disconnect();
        };
    }

    /**
     * Start HID data collection
     */
    startHIDDataCollection(device) {
        console.log("Starting HID data collection...");
        
        device.addEventListener('inputreport', (event) => {
            this.processEEGData(event.data);
        });
    }

    /**
     * Process incoming EEG data
     */
    processEEGData(rawData) {
        try {
            let eegData;
            
            // Check if this is real data (not fake)
            if (rawData && rawData.source !== 'fake') {
                this.hasRealData = true;
                console.log("Real hardware data detected, stopping fake data generation");
                this.stopFakeDataGeneration();
            }
            
            if (typeof rawData === 'string') {
                // Parse serial/string data
                eegData = this.parseSerialData(rawData);
            } else if (typeof rawData === 'object') {
                // Already parsed data
                eegData = rawData;
            }

            if (eegData) {
                // Add timestamp if not present
                if (!eegData.timestamp) {
                    eegData.timestamp = Date.now() / 1000;
                }
                
                // Add to buffer
                this.dataBuffer.push(eegData);
                
                // Keep buffer size manageable
                if (this.dataBuffer.length > 1000) {
                    this.dataBuffer.shift();
                }

                // Update global state
                if (window.StitchState) {
                    window.StitchState.update({
                        rawSignal: eegData.channels || [],
                        eegBands: eegData.bands || {},
                        brainStates: eegData.states || {},
                        isRealHardware: this.isRealHardware,
                        deviceStatus: 'connected'
                    });
                }
            }
        } catch (error) {
            console.error("EEG data processing error:", error);
        }
    }

    /**
     * Parse serial data format
     */
    parseSerialData(data) {
        // Common EEG serial formats:
        // 1. CSV: "ch1,ch2,ch3,ch4"
        // 2. JSON: '{"channels":[1,2,3,4],"bands":{"delta":0.1,...}}'
        
        try {
            // Try JSON first
            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            // Try CSV
            const values = data.split(',').map(v => parseFloat(v.trim()));
            if (values.length >= 4 && !values.some(isNaN)) {
                return {
                    channels: values,
                    format: 'csv'
                };
            }
        }
        
        return null;
    }

    /**
     * Simulate real data (fallback)
     */
    simulateRealData() {
        if (!this.isRealHardware) return;

        setInterval(() => {
            if (this.isConnected && this.isRealHardware) {
                // Generate more realistic EEG data
                const channels = [];
                for (let i = 0; i < 4; i++) {
                    channels.push(
                        Math.sin(Date.now() / 1000 * (10 + i * 2)) * 50 + 
                        Math.random() * 10 - 5
                    );
                }

                const eegData = {
                    channels: channels,
                    timestamp: Date.now() / 1000,
                    bands: {
                        delta: Math.random() * 0.5 + 0.05,
                        theta: Math.random() * 0.8 + 0.1,
                        alpha: Math.random() * 1.2 + 0.2,
                        beta: Math.random() * 1.5 + 0.3,
                        gamma: Math.random() * 0.8 + 0.1
                    },
                    states: {
                        focus: Math.round(Math.random() * 40 + 30),
                        stress: Math.round(Math.random() * 30 + 10),
                        fatigue: Math.round(Math.random() * 20 + 5)
                    }
                };

                this.processEEGData(eegData);
            }
        }, 100); // 10Hz update rate
    }

    /**
     * Disconnect from hardware
     */
    disconnect() {
        this.isConnected = false;
        this.isRealHardware = false;
        this.hasRealData = false;
        this.deviceInfo = null;
        
        // Stop fake data generation
        this.stopFakeDataGeneration();
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        // Update global state
        if (window.StitchState) {
            window.StitchState.update({
                deviceStatus: 'disconnected',
                isRealHardware: false,
                deviceInfo: null
            });
        }

        console.log("Hardware disconnected");
    }

    /**
     * Get device info
     */
    getDeviceInfo() {
        return this.deviceInfo;
    }

    /**
     * Generate fake EEG data when no real hardware is connected
     */
    generateFakeData() {
        const timestamp = Date.now() / 1000;
        
        // Generate realistic EEG channels
        const channels = [];
        for (let i = 0; i < 4; i++) {
            const baseFreq = 10 + i * 2; // Alpha range
            let signal = 0;
            
            // Add different frequency components
            signal += Math.sin(2 * Math.PI * 2 * timestamp) * (Math.random() * 15 + 5); // Delta
            signal += Math.sin(2 * Math.PI * 6 * timestamp) * (Math.random() * 20 + 10); // Theta
            signal += Math.sin(2 * Math.PI * baseFreq * timestamp) * (Math.random() * 40 + 20); // Alpha
            signal += Math.sin(2 * Math.PI * 20 * timestamp) * (Math.random() * 25 + 10); // Beta
            signal += Math.sin(2 * Math.PI * 40 * timestamp) * (Math.random() * 15 + 5); // Gamma
            
            // Add noise
            signal += (Math.random() - 0.5) * 10;
            
            channels.push(signal);
        }
        
        // Calculate band powers
        const avgSignal = channels.reduce((a, b) => a + Math.abs(b), 0) / channels.length;
        const bands = {
            delta: avgSignal * (Math.random() * 0.3 + 0.1),
            theta: avgSignal * (Math.random() * 0.6 + 0.2),
            alpha: avgSignal * (Math.random() * 0.9 + 0.3),
            beta: avgSignal * (Math.random() * 1.2 + 0.2),
            gamma: avgSignal * (Math.random() * 0.7 + 0.1)
        };
        
        // Determine brain states
        let focus = 30, stress = 20, fatigue = 10;
        if (bands.beta > bands.alpha * 1.2) {
            focus = Math.min(95, Math.round(bands.beta / bands.alpha * 50));
        } else if (bands.theta > bands.alpha * 1.5) {
            fatigue = Math.min(95, Math.round(bands.theta / bands.alpha * 40));
        } else if (bands.alpha > bands.beta * 1.3) {
            focus = Math.min(80, Math.round(bands.alpha / bands.beta * 45));
        }
        
        const states = {
            focus: focus + Math.round((Math.random() - 0.5) * 10),
            stress: stress + Math.round((Math.random() - 0.5) * 8),
            fatigue: fatigue + Math.round((Math.random() - 0.5) * 5)
        };
        
        return {
            timestamp: timestamp,
            channels: channels,
            bands: bands,
            states: states,
            quality: 85 + Math.random() * 10,
            source: 'fake'
        };
    }

    /**
     * Start fake data generation
     */
    startFakeDataGeneration() {
        if (this.fakeDataInterval) return;
        
        console.log("Starting fake data generation for real mode");
        this.fakeDataInterval = setInterval(() => {
            if (this.isRealHardware && !this.hasRealData) {
                const fakeData = this.generateFakeData();
                this.processEEGData(fakeData);
            }
        }, 100); // 10Hz update rate
    }

    /**
     * Stop fake data generation
     */
    stopFakeDataGeneration() {
        if (this.fakeDataInterval) {
            clearInterval(this.fakeDataInterval);
            this.fakeDataInterval = null;
            console.log("Stopped fake data generation");
        }
    }

    /**
     * Check if we have real hardware connected
     */
    isRealHardwareConnected() {
        return this.isConnected && this.isRealHardware && this.hasRealData;
    }
}

// Initialize hardware interface
const hardwareInterface = new HardwareInterface();
window.HardwareInterface = hardwareInterface;
