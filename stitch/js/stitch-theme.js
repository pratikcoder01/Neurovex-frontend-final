/**
 * Neurovex Shared Tailwind Configuration
 * Loads into the browser's tailwind.config object
 */

window.tailwind = window.tailwind || {};

window.tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "var(--color-primary)",
                "primary-dark": "var(--color-primary-dark)",
                "background-light": "var(--bg-body)",
                "background-dark": "var(--bg-body)", /* Use same var, let CSS handle value */
                "surface-light": "var(--bg-surface)",
                "surface-dark": "var(--bg-surface)",
                "surface-highlight": "var(--bg-surface-highlight)",
                "border-light": "var(--border-color)",
                "text-main": "var(--text-primary)",
                "text-sub": "var(--text-secondary)",
                "text-muted": "var(--text-muted)",
                "medical-teal": "var(--color-secondary)",
                "alert-amber": "var(--color-accent)",
                "safe-emerald": "var(--color-success)",
                "danger-rose": "var(--color-danger)"
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "mono": ["JetBrains Mono", "monospace"],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            boxShadow: {
                'glow': 'var(--shadow-glow)',
            }
        },
    },
};

/**
 * Global Theme Toggle Logic
 * Can be used on any page with <button id="theme-toggle">
 */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check Local Storage or System Preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Optional: Update icon visibility if using material icons method
            updateToggleIcons(html.classList.contains('dark'));
        });
    }
}

function updateToggleIcons(isDark) {
    // Expects strict structure: dark_mode icon (moon) and light_mode icon (sun)
    const moon = document.querySelector('#theme-toggle .material-icons:first-child');
    const sun = document.querySelector('#theme-toggle .material-icons:last-child');
    if (moon && sun) {
        if (isDark) {
            moon.classList.add('hidden');
            sun.classList.remove('hidden');
        } else {
            moon.classList.remove('hidden');
            sun.classList.add('hidden');
        }
    }
}
