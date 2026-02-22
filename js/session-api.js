/**
 * Neurovex Session API
 * Handles Start/Stop Recording calls to Backend
 */

const SessionAPI = {
    isRecording: false,
    currentSessionId: null,

    startSession: async (focusMode = "general") => {
        const token = StitchAuth.getToken();
        if (!token) {
            Stitch.notify("Please sign in to record sessions", "error");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/v1/sessions/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    duration_minutes: 10,
                    focus_mode: focusMode
                })
            });

            if (!response.ok) throw new Error("Failed to start session");

            const data = await response.json();
            SessionAPI.isRecording = true;
            SessionAPI.currentSessionId = data.session_id;

            // Notify WebSocket to Start Logging
            if (window.StreamManager && window.StreamManager.socket) {
                window.StreamManager.socket.send(JSON.stringify({
                    action: "start_log",
                    session_id: data.session_id
                }));
            }

            // Notify User
            Stitch.notify(`Recording Started: ${data.session_id}`);
            return data;

        } catch (err) {
            console.error(err);
            Stitch.notify("Backend not reachable. Is the server running?", "error");
            throw err;
        }
    },

    endSession: async () => {
        if (!SessionAPI.currentSessionId) return;
        const token = StitchAuth.getToken();

        try {
            const response = await fetch("http://localhost:8000/api/v1/sessions/end", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: SessionAPI.currentSessionId
                })
            });

            const data = await response.json();

            // Notify WebSocket to Stop Logging
            if (window.StreamManager && window.StreamManager.socket) {
                window.StreamManager.socket.send(JSON.stringify({
                    action: "stop_log"
                }));
            }

            SessionAPI.isRecording = false;
            SessionAPI.currentSessionId = null;

            // Notify User
            Stitch.notify(`Session Saved. ID: ${data.session_id}`);
            return data;

        } catch (err) {
            console.error(err);
            Stitch.notify("Error saving session", "error");
        }
    }
};

window.SessionAPI = SessionAPI;

// Toggle Logic for UI
window.toggleRecording = async function () {
    const btn = document.getElementById('btn-record');
    const label = btn.querySelector('span:last-child');
    const icon = btn.querySelector('.material-icons');

    if (!SessionAPI.isRecording) {
        // Start
        try {
            label.innerText = "Starting...";
            await SessionAPI.startSession();

            // UI Update: Active State
            btn.classList.remove('bg-rose-50', 'text-rose-600', 'border-rose-200');
            btn.classList.add('bg-rose-600', 'text-white', 'border-rose-600', 'animate-pulse');
            label.innerText = "Recording...";
            icon.innerText = "stop";
        } catch (e) {
            label.innerText = "Start Recording"; // Revert
        }
    } else {
        // Stop
        await SessionAPI.endSession();

        // UI Update: Idle State
        btn.classList.add('bg-rose-50', 'text-rose-600', 'border-rose-200');
        btn.classList.remove('bg-rose-600', 'text-white', 'border-rose-600', 'animate-pulse');
        label.innerText = "Start Recording";
        icon.innerText = "radio_button_checked";
    }
}
