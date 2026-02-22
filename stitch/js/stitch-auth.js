/**
 * Neurovex Authentication Logic
 * Handles User Sessions, Sign In, Sign Up via Supabase
 */

// Initialize Supabase Client (Frontend)
const SUPABASE_URL = 'https://blbkpjwhfdirzmdctlyp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MLguebs96ySI-CtaHjzZvg_xQPKx9Jp';
// SET THIS TO TRUE TO BYPASS SUPABASE
const MOCK_AUTH = true;

const StitchAuth = {
    client: null,

    init: () => {
        if (MOCK_AUTH) {
            console.log("StitchAuth: Running in MOCK MODE");
            return;
        }

        if (SUPABASE_URL.includes('your_project_url') || SUPABASE_KEY.includes('your_anon_public_key')) {
            alert("CRITICAL ERROR: Supabase Credentials not set!\n\nPlease open 'stitch/js/stitch-auth.js' and update SUPABASE_URL and SUPABASE_KEY with your own from Supabase Dashboard.");
            console.error("Supabase Credentials Missing");
            return;
        }

        if (window.supabase) {
            StitchAuth.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("Supabase Client Initialized");
        } else {
            console.error("Supabase Script not loaded!");
            // alert("Error: Supabase script not loaded. Check internet connection."); 
        }
    },

    login: async (email, password) => {
        if (MOCK_AUTH) {
            console.log("Mock Login Successful");
            const user = {
                id: 'mock-user-id',
                email: email,
                role: 'researcher',
                name: email.split('@')[0],
                token: 'mock-token-123'
            };
            localStorage.setItem('neurovex_user', JSON.stringify(user));
            localStorage.setItem('neurovex_token', user.token);
            StitchState.update('currentUser', user);
            return user;
        }

        if (!StitchAuth.client) StitchAuth.init();
        if (!StitchAuth.client) return Promise.reject("Supabase not initialized");

        const { data, error } = await StitchAuth.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const user = {
            id: data.user.id,
            email: data.user.email,
            role: 'researcher', // Default
            name: data.user.email.split('@')[0],
            token: data.session.access_token
        };

        localStorage.setItem('neurovex_user', JSON.stringify(user));
        // Also save token for backend requests
        localStorage.setItem('neurovex_token', user.token);

        StitchState.update('currentUser', user);
        return user;
    },

    signup: async (email, password) => {
        if (MOCK_AUTH) {
            console.log("Mock Signup Successful");
            return { user: { email: email }, session: null };
        }

        if (!StitchAuth.client) StitchAuth.init();
        const { data, error } = await StitchAuth.client.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    logout: async () => {
        if (StitchAuth.client) await StitchAuth.client.auth.signOut();
        localStorage.removeItem('neurovex_user');
        localStorage.removeItem('neurovex_token');
        StitchState.update('currentUser', null);
        window.location.href = 'index.html';
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('neurovex_user');
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('neurovex_user'));
    },

    getToken: () => {
        return localStorage.getItem('neurovex_token');
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', StitchAuth.init);

window.StitchAuth = StitchAuth;
