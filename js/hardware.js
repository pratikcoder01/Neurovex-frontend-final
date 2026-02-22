/**
 * Neurovex Hardware Control Logic
 * Handles Thresholds, Safety Interlocks, and Simulation
 */

window.HardwareLogic = {
  settings: {
    focusThreshold: 65,
    emergencyStop: false
  },

  // UI Elements cache
  ui: {},

  init() {
    this.cacheUI();
    this.bindEvents();

    // ... inside init ...
    // Subscribe to state
    StitchState.subscribe((data, key, val) => {
      // Logic for Brain State (Updates Focus Bar)
      if (key === 'brainStates') {
        this.processBrainState(val);
      }

      // Logic for Hardware (Updates Icons/Sliders from Backend)
      if (key === 'hardware' && val) {
        this.renderBackendHardware(val);
      }

      // [NEW] Connection Status
      if (key === 'deviceStatus') {
        this.updateConnectionStatus(val);
      }
    });

    // Initial Status Check
    const initialState = StitchState.get();
    if (initialState.deviceStatus) {
      this.updateConnectionStatus(initialState.deviceStatus);
    }

    Stitch.log('Hardware', 'Armed and Ready');
  },

  // ... ui cache ...
  cacheUI() {
    this.ui = {
      slider: document.getElementById('threshold-slider'),
      dispThresh: document.getElementById('disp-thresh'),
      liveFocus: document.getElementById('live-focus'),
      liveFocusBar: document.getElementById('live-focus-bar'),
      statusIndicator: document.getElementById('status-indicator'),
      safetyStatus: document.getElementById('safety-status'),
      lightGlow: document.getElementById('light-glow'),
      lightState: document.getElementById('light-state'),
      iconLight: document.getElementById('icon-light'),
      armSlider: document.getElementById('arm-slider'),
      iconArm: document.getElementById('icon-arm'),
      // [NEW] Connection UI
      indSignal: document.getElementById('ind-signal-status'),
      valSignal: document.getElementById('val-signal-status'),
      dirs: {
        up: document.getElementById('dir-up'),
        down: document.getElementById('dir-down'),
        left: document.getElementById('dir-left'),
        right: document.getElementById('dir-right')
      }
    };
  },

  // ... bindEvents ...

  // [NEW] Update Connection UI
  updateConnectionStatus(status) {
    if (!this.ui.indSignal || !this.ui.valSignal) return;

    if (status === 'connected') {
      this.ui.indSignal.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse transition-colors";
      this.ui.valSignal.innerText = "CONNECTED";
      this.ui.valSignal.className = "text-xs font-mono font-bold text-emerald-600 transition-colors";
    } else {
      this.ui.indSignal.className = "w-2 h-2 rounded-full bg-slate-400 transition-colors";
      this.ui.valSignal.innerText = "DISCONNECTED";
      this.ui.valSignal.className = "text-xs font-mono font-bold text-slate-500 transition-colors";
    }
  },

  bindEvents() {
    this.ui.slider.addEventListener('input', (e) => {
      this.settings.focusThreshold = parseInt(e.target.value);
      this.ui.dispThresh.innerText = this.settings.focusThreshold + '%';
    });
  },

  // ... emergencyStop and resetHardware unchanged ...
  emergencyStop() {
    this.settings.emergencyStop = true;
    this.ui.safetyStatus.classList.replace('bg-green-100', 'bg-red-600');
    this.ui.safetyStatus.classList.replace('text-green-700', 'text-white');
    this.ui.safetyStatus.innerHTML = `<span class="material-icons">warning</span> EMERGENCY STOP ACTIVE`;
    this.resetHardware();
    Stitch.notify('EMERGENCY STOP TRIGGERED', 'error');
  },

  resetHardware() {
    this.ui.lightGlow.style.opacity = '0';
    this.ui.lightState.innerText = 'OFF';
    this.ui.armSlider.style.left = '4px';
    Object.values(this.ui.dirs).forEach(el => el.className = el.className.replace('bg-teal-100 border-teal-500', 'bg-slate-50 border-slate-200'));
  },

  // Process Focus Level Only for display/locking
  processBrainState(states) {
    if (this.settings.emergencyStop) return;
    const focus = states.focus;
    this.ui.liveFocus.innerText = focus + '%';
    this.ui.liveFocusBar.style.width = focus + '%';

    // Safety Lock
    const isActive = focus >= this.settings.focusThreshold;
    if (isActive) {
      this.ui.statusIndicator.innerText = 'SIGNAL LOCKED - ACTIVE';
      this.ui.liveFocusBar.className = 'bg-primary h-full transition-all duration-300';
    } else {
      this.ui.statusIndicator.innerText = 'WAITING FOR SIGNAL';
      this.ui.liveFocusBar.className = 'bg-slate-400 h-full transition-all duration-300';
    }
  },

  // [NEW] Render state directly from Backend
  renderBackendHardware(hw) {
    if (this.settings.emergencyStop) return;

    // 1. Light
    const bulb = hw.bulb || {};
    if (bulb.state === 'on') {
      this.ui.lightGlow.style.opacity = Math.min(1, bulb.brightness / 100).toString();
      this.ui.lightState.innerText = `ON (${bulb.brightness}%)`;
      this.ui.iconLight.classList.add('bg-yellow-100', 'text-yellow-600');
      this.ui.iconLight.classList.remove('bg-slate-100', 'text-slate-400');
    } else {
      this.ui.lightGlow.style.opacity = '0';
      this.ui.lightState.innerText = 'OFF';
      this.ui.iconLight.classList.add('bg-slate-100', 'text-slate-400');
      this.ui.iconLight.classList.remove('bg-yellow-100', 'text-yellow-600');
    }

    // 2. RC Car (Mobility)
    const car = hw.car || {};
    this.resetDirs();
    if (car.direction && car.direction !== 'stop') {
      const el = this.ui.dirs[car.direction];
      if (el) {
        el.className = el.className.replace('bg-slate-50 border-slate-200', 'bg-teal-100 border-teal-500 transform scale-105');
        el.querySelector('span').classList.add('text-teal-600');
        el.querySelector('span').classList.remove('text-slate-300');
      }
    }

    // 3. Arm (Proportional to speed/focus for now)
    if (car.speed > 0) {
      this.ui.armSlider.style.left = `${Math.min(90, car.speed)}%`;
    } else {
      this.ui.armSlider.style.left = '4px';
    }
  },

  resetDirs() {
    Object.values(this.ui.dirs).forEach(el => {
      if (el) {
        el.className = 'aspect-square bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center transition-all';
        el.querySelector('span').className = 'material-icons text-slate-300 text-3xl';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.HardwareLogic.init();
});
