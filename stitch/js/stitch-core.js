/**
 * Neurovex Core Utilities
 * Shared helper functions for DOM, Logging, and Formatting
 */

const Stitch = {
    // Medical-grade logging with timestamps
    log: (component, message, data = null) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] [${component}] ${message}`;
        if (data) {
            console.log(logMsg, data);
        } else {
            console.log(logMsg);
        }
    },

    // Format frequency data for display
    formatHz: (val) => `${val.toFixed(1)} Hz`,

    // Format voltage for display
    formatVoltage: (val) => `${val.toFixed(2)} µV`,

    // Safe DOM Element Selector
    getElement: (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`[Stitch] Element with ID '${id}' not found.`);
        }
        return el;
    },

    // UI Feedback (Toast/Alert placeholder)
    notify: (message, type = 'info') => {
        // simple console fallback, can be expanded to UI toast
        console.log(`[UI-NOTIFY] [${type.toUpperCase()}]: ${message}`);
    },

    // Random number generator for simulation (Gaussian-ish)
    randomGaussian: (mean = 0, stdev = 1) => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + stdev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
};

window.Stitch = Stitch;
