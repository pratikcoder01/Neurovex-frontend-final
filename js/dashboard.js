/**
 * Neurovex Dashboard Logic
 * Handles Visualization and UI updates based on StitchState
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log("Dashboard script loaded");
  
  // 1. User Info Initialization
  const user = StitchAuth.getCurrentUser();
  if (user) {
    document.getElementById('user-name').innerText = user.name || user.email;
    document.getElementById('user-role').innerText = (user.role || 'GUEST').toUpperCase();
  } else {
    // Optional: Redirect to login if strict auth required
    // StitchAuth.requireAuth(); 
    console.log("Running in unauthenticated Guest Mode");
  }

  // 2. Setup Waveform Canvases
  const container = document.getElementById('waveform-container');
  const channels = [
    { name: 'FP1', color: '#2463eb', label: 'Frontal Left' },
    { name: 'FP2', color: '#8b5cf6', label: 'Frontal Right' },
    { name: 'T3', color: '#0ea5e9', label: 'Temporal Left' },
    { name: 'T4', color: '#f43f5e', label: 'Temporal Right' }
  ];

  const channelContexts = [];

  // Create Canvas Elements
  channels.forEach(ch => {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex-1 relative border-b border-slate-100/50 group w-full';

    const label = document.createElement('span');
    label.className = `absolute left-14 top-2 text-[10px] font-bold text-slate-400 group-hover:text-[${ch.color}] transition-colors font-mono`;
    label.style.color = ch.color; // inline fallback
    label.innerText = `${ch.name} - ${ch.label}`;

    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full';

    wrapper.appendChild(label);
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    channelContexts.push({
      ctx: canvas.getContext('2d'),
      canvas: canvas,
      color: ch.color,
      data: new Array(500).fill(0), // Buffer
      offset: Math.random() * 100 // Phase offset
    });
  });

  // Resize Handler
  function resizeCanvases() {
    channelContexts.forEach(c => {
      const rect = c.canvas.parentElement.getBoundingClientRect();
      c.canvas.width = rect.width;
      c.canvas.height = rect.height;
    });
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases(); // Init

  // 3. Visualization Loop
  let time = 0;
  function draw() {
    // Get current state
    const state = StitchState.get();
    const isConnected = state.deviceStatus === 'connected';

    // Check if we have real data buffering
    const rawSignal = state.rawSignal;
    const hasRealData = isConnected && rawSignal && rawSignal.length > 0;

    channelContexts.forEach((c, idx) => {
      const w = c.canvas.width;
      const h = c.canvas.height;
      const ctx = c.ctx;

      if (hasRealData) {
        // --- REAL DATA RENDERING (Modulated) ---
        // Just like landing page, we use a hybrid approach for smoothness
        // but modulated heavily by the real signal if possible relative to intensity.

        // Simulating the "Active" channel feel
        // If we want to be strict: Only CH1 gets signal if channelCount=1
        // But for UI "Coolness", let's animate all based on the single input + slight offset

        // Get last sample from signal for "live" feel
        const signalVal = rawSignal[rawSignal.length - 1] || 0;

        // Scale it (Signal is +/- 50ish usually) to Canvas Height
        // Canvas is say 100px. 
        // Val 50 -> 25px offset.

        // We push to buffer
        c.data.push(signalVal / 3.0 + (Math.random() - 0.5) * 2); // add slight noise for realism per channel
        c.data.shift();

      } else {
        // --- OFFLINE SIMULATION ---
        time += 1;
        // Flatline if disconnected? Or Sim?
        // User wants "connected" to show real. 
        // If disconnected, let's flatline or just low noise to indicate "waiting".

        const noise = (Math.random() - 0.5) * 5;
        // If we are strictly disconnected, maybe just noise?
        // Existing code had a sine wave. let's keep it for "Demo Mode".
        if (state.isDemoMode) {
          const newVal = Math.sin((time * 0.1) + c.offset) * (h / 8) + (Math.random() - 0.5) * 2;
          c.data.push(newVal);
          c.data.shift();
        } else {
          c.data.push(noise); // Just noise
          c.data.shift();
        }
      }

      // Render
      ctx.clearRect(0, 0, w, h);

      // Dynamic Color based on connectivity
      ctx.strokeStyle = isConnected ? '#10b981' : (state.isDemoMode ? c.color : '#94a3b8'); // Emerald if connected, Color if demo, Slate if dead

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      const step = w / (c.data.length - 1);

      c.data.forEach((val, i) => {
        const x = i * step;
        const y = h / 2 + val;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }
  draw();

  // 4. Device Status Updates
  function updateDeviceStatus(state) {
    const elName = document.getElementById('device-name');
    const elSpecs = document.getElementById('device-specs');
    const elBat = document.getElementById('device-battery');
    const elImp = document.getElementById('device-impedance');
    const elLag = document.getElementById('device-lag');
    const elChannelList = document.getElementById('channel-list');

    if (state.deviceStatus === 'connected') {
      if (elName) elName.innerText = "Neurovex Headband";
      if (elName) elName.className = "font-bold text-safe-emerald";

      const chCount = state.channelCount || 1;
      if (elSpecs) elSpecs.innerText = `${chCount}-Channel • 250Hz`;

      if (elBat) elBat.innerText = "85%"; // Mocked battery for now as backend doesn't send it yet
      if (elImp) elImp.innerText = "< 15kΩ";
      if (elLag) elLag.innerText = "24ms";

      // Update Channel List
      if (elChannelList) {
        // Re-render based on count
        let html = '';
        for (let i = 0; i < 4; i++) {
          // If we have 1 channel, only first is "Good"
          const isGood = i < chCount;
          const statusColor = isGood ? 'text-safe-emerald' : 'text-slate-300';
          const statusText = isGood ? 'Good' : 'Off';
          const dotColor = isGood ? channels[i].color : '#cbd5e1';

          html += `
                    <div class="flex justify-between items-center text-xs p-2 hover:bg-slate-50 rounded transition-colors group cursor-default">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${dotColor}"></span>
                            <span class="font-medium text-slate-600">CH${i + 1} (${channels[i].name})</span>
                        </div>
                        <span class="font-mono ${statusColor} group-hover:text-primary transition-colors">${statusText}</span>
                    </div>`;
        }
        elChannelList.innerHTML = html;
      }

    } else {
      if (elName) elName.innerText = "Device Disconnected";
      if (elName) elName.className = "font-bold text-slate-400";
      if (elSpecs) elSpecs.innerText = "-- Channel • --Hz";
      if (elBat) elBat.innerText = "--%";
      if (elImp) elImp.innerText = "--";
      if (elLag) elLag.innerText = "--";

      // Update Channel List to "Scanning..." or empty
      if (elChannelList) {
        elChannelList.innerHTML = `<div class="text-center text-slate-400 text-xs py-4 italic">Waiting for connection...</div>`;
      }
    }
  }

  // 5. Subscribe to State
  StitchState.subscribe((data, key, val) => {
    console.log(`State update: ${key} =`, val);
    
    // Update mode indicator
    if (key === 'isRealHardware' || key === 'deviceStatus') {
      updateModeIndicator(data);
    }
    
    // Update device info
    if (key === 'deviceInfo') {
      updateDeviceInfo(val);
    }
    
    // UI Updates
    if (key === 'brainStates') {
      updateBar('focus', val.focus, 'primary');
      updateBar('stress', val.stress, 'danger-rose');
      updateBar('fatigue', val.fatigue, 'alert-amber');
      document.getElementById('confidence-score').innerText = (val.engagement || 0) + '%';
    }

    if (key === 'eegBands') {
      if (document.getElementById('band-delta')) document.getElementById('band-delta').innerText = val.delta.toFixed(2) + ' µV²';
      if (document.getElementById('band-theta')) document.getElementById('band-theta').innerText = val.theta.toFixed(2) + ' µV²';
      if (document.getElementById('band-alpha')) document.getElementById('band-alpha').innerText = val.alpha.toFixed(2) + ' µV²';
      if (document.getElementById('band-beta')) document.getElementById('band-beta').innerText = val.beta.toFixed(2) + ' µV²';
    }

    if (key === 'deviceStatus' || key === 'channelCount') {
      updateDeviceStatus(data);
    }
  });

  // Init Status
  updateDeviceStatus(StitchState.get());

  // Helper to update bars
  function updateBar(metric, value, colorClass) {
    const bar = document.getElementById(`bar-${metric}`);
    const text = document.getElementById(`val-${metric}`);
    if (bar && text) {
      bar.style.width = `${value}%`;
      text.innerText = `${value}%`;
    }
  }

  // Update mode indicator
  function updateModeIndicator(state) {
    const modeIndicator = document.getElementById('mode-indicator');
    const modeText = document.getElementById('mode-text');
    const toggleText = document.getElementById('toggle-text');
    const sessionId = document.getElementById('session-id');
    
    if (state.isRealHardware && state.deviceStatus === 'connected') {
      // Real hardware mode
      const hasRealData = window.HardwareInterface && window.HardwareInterface.hasRealData;
      if (hasRealData) {
        modeIndicator.className = 'bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ring-1 ring-emerald-500/20';
        modeText.textContent = 'REAL HARDWARE';
      } else {
        modeIndicator.className = 'bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ring-1 ring-amber-500/20';
        modeText.textContent = 'REAL HARDWARE (FAKE DATA)';
      }
      toggleText.textContent = 'Switch to Demo';
      sessionId.textContent = 'NVX-REAL-' + Date.now().toString().slice(-6);
    } else {
      // Demo mode
      modeIndicator.className = 'bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ring-1 ring-primary/20';
      modeText.textContent = 'DEMO MODE';
      toggleText.textContent = 'Connect Hardware';
      sessionId.textContent = 'NVX-DEMO-001';
    }
  }

  // Update device info
  function updateDeviceInfo(deviceInfo) {
    if (!deviceInfo) return;
    
    const deviceName = document.getElementById('device-name');
    const deviceSpecs = document.getElementById('device-specs');
    
    if (deviceName) {
      deviceName.textContent = deviceInfo.name || 'Unknown Device';
      deviceName.className = 'font-bold text-safe-emerald';
    }
    
    if (deviceSpecs && deviceInfo.type) {
      const specs = {
        'bluetooth': 'Bluetooth • 250Hz',
        'serial': 'Serial • 250Hz',
        'websocket': `WebSocket • 250Hz`,
        'hid': 'USB • 250Hz'
      };
      deviceSpecs.textContent = specs[deviceInfo.type] || 'Unknown • --Hz';
    }
  }

  // Toggle between demo and real hardware mode
  window.toggleMode = function() {
    const state = StitchState.get();
    
    if (state.isRealHardware) {
      // Switch to demo mode
      if (window.HardwareInterface) {
        window.HardwareInterface.disconnect();
      }
      StitchState.update({
        isRealHardware: false,
        deviceStatus: 'disconnected',
        deviceInfo: null
      });
    } else {
      // Try to connect real hardware
      if (window.HardwareInterface) {
        window.HardwareInterface.startDetection();
      }
    }
  };
});

