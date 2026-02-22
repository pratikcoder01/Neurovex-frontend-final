/**
 * NEURAL LINK BRAIN VISUALIZATION 6.0 (Medical Theme & Dark Mode Aware)
 * 
 * Aesthetic: Futuristic, HIGH CONTRAST.
 * Behavior: Adapts to system theme via CSS Variables.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNeuralLinkBrain();
});

function initNeuralLinkBrain() {
    const container = document.getElementById('brain-container');
    if (!container) return;

    // Helper to get CSS variable color
    function getThemeColor(varName) {
        const style = getComputedStyle(document.documentElement);
        const colorStr = style.getPropertyValue(varName).trim();
        return new THREE.Color(colorStr || 0x2563eb);
    }

    // --- Configuration ---
    const config = {
        particleCount: 1500, // Reduced from 2800 for cleaner look
        connectionDistance: 0.45, // Reduced from 0.7 to avoid hairball
        rotationSpeed: 0.0005, // Slower rotation for calm feel
        brainSize: 2.0
    };

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5.0;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // --- 1. Brain Point Cloud ---
    const positions = [];
    const colors = [];
    const randoms = [];

    // Tighter Brain Shape
    function isInsideBrain(x, y, z) {
        if (Math.abs(x) < 0.05) return false;

        let sx = Math.abs(x);

        // Main Ellipsoid
        const d1 = (sx - 0.2) ** 2 / 0.81 + (y) ** 2 / 1.0 + (z) ** 2 / 1.69;

        // Cut bottom flat-ish
        if (y < -0.8) return false;

        return d1 <= 1.0;
    }

    let attempts = 0;
    while (positions.length < config.particleCount * 3 && attempts < 100000) {
        attempts++;
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 2.5;
        const z = (Math.random() - 0.5) * 3.5;

        if (isInsideBrain(x, y, z)) {
            positions.push(x, y, z);

            // Base colors are white/gray in geometry, colored by shader based on uniform
            randoms.push(Math.random());

            // Push dummy color
            colors.push(1, 1, 1);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));

    // Particle Material
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: window.devicePixelRatio },
            uColorPrimary: { value: getThemeColor('--color-primary') },
            uColorSecondary: { value: getThemeColor('--color-secondary') }
        },
        vertexShader: `
            attribute float aRandom;
            varying float vRandom;
            uniform float uTime;
            uniform float uScale;

            void main() {
                vRandom = aRandom;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;

                float pulse = 1.0 + 0.3 * sin(uTime * 1.5 + aRandom * 50.0);
                gl_PointSize = (3.5 * pulse * uScale) * (3.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying float vRandom;
            uniform float uTime;
            uniform vec3 uColorPrimary;
            uniform vec3 uColorSecondary;

            void main() {
                vec2 center = gl_PointCoord - 0.5;
                if (length(center) > 0.5) discard;

                // Sharpened edges for cleaner look
                float alpha = 1.0 - smoothstep(0.3, 0.5, length(center));
                
                // Flash interaction
                float flash = smoothstep(0.95, 1.0, sin(uTime * 0.8 + vRandom * 30.0));
                
                // Color mixing
                vec3 base = mix(uColorPrimary, uColorSecondary, vRandom);
                vec3 finalColor = mix(base, vec3(1.0), flash * 0.8); 
                
                if (alpha < 0.05) discard;
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, particleMaterial);
    group.add(points);

    // --- 2. Neural Lines ---
    const vecs = [];
    for (let j = 0; j < positions.length; j += 3) {
        vecs.push(new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]));
    }

    const linePos = [];
    const lineOffsets = [];
    const maxConnections = 5; // Reduced from 6

    for (let i = 0; i < vecs.length; i++) {
        let connections = 0;
        for (let j = i + 1; j < vecs.length; j++) {
            const distSq = vecs[i].distanceToSquared(vecs[j]);
            if (distSq < config.connectionDistance * config.connectionDistance) {
                linePos.push(vecs[i].x, vecs[i].y, vecs[i].z, vecs[j].x, vecs[j].y, vecs[j].z);
                const offset = Math.random() * 10.0;
                lineOffsets.push(offset, offset);
                connections++;
                if (connections > maxConnections) break;
            }
        }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aOffset', new THREE.Float32BufferAttribute(lineOffsets, 1));

    const lineMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: getThemeColor('--color-primary') }
        },
        vertexShader: `
            attribute float aOffset;
            varying float vOffset;
            void main() {
                vOffset = aOffset;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying float vOffset;

            void main() {
                // Calm Signal Pulse
                float signal = smoothstep(0.85, 1.0, sin(uTime * 1.0 + vOffset)); // Slower pulse
                vec3 c = mix(uColor, vec3(1.0), signal * 0.7); // Less white
                float a = 0.03 + signal * 0.4; // Lower base alpha to prevent washing out
                gl_FragColor = vec4(c, a);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const lines = new THREE.LineSegments(lineGeo, lineMaterial);
    group.add(lines);

    group.rotation.x = 0.2;
    group.scale.set(1.5, 1.5, 1.5);

    // --- Animation & Interaction ---
    const clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;

    // Only add listener if container is visible
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        // Normalized -1 to 1
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    // Theme Observer: Watch for class changes on <html>
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateColors();
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });

    function updateColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = document.documentElement.classList.contains('dark');

        // Get colors from CSS vars
        const primaryStr = style.getPropertyValue('--color-primary').trim();
        const secondaryStr = style.getPropertyValue('--color-secondary').trim();

        const primary = new THREE.Color(primaryStr || 0x2563eb);
        const secondary = new THREE.Color(secondaryStr || 0x0ea5e9);

        // Update Uniforms
        if (particleMaterial.uniforms.uColorPrimary) {
            particleMaterial.uniforms.uColorPrimary.value.copy(primary);
            particleMaterial.uniforms.uColorSecondary.value.copy(secondary);
            lineMaterial.uniforms.uColor.value.copy(primary);

            // Critical Fix for Light Mode Visibility
            // AdditiveBlending adds to white background = invisible white
            // NormalBlending overlays color = visible blue
            const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

            particleMaterial.blending = blending;
            lineMaterial.blending = blending;

            // Adjust opacity/intensity based on mode
            // Light mode needs slightly more opacity to stand out
            // We can pass a 'uIsDark' or just tweak colors. 
            // Here we rely on the blending change being sufficient, 
            // but we ensure needsUpdate is true
            particleMaterial.needsUpdate = true;
            lineMaterial.needsUpdate = true;
        }
    }

    // Initial call to set colors
    updateColors();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        particleMaterial.uniforms.uTime.value = time;
        lineMaterial.uniforms.uTime.value = time;

        group.rotation.y += config.rotationSpeed;

        // Soft Mouse Parallax
        const targetX = mouseY * 0.1;
        const targetY = -mouseX * 0.1;

        group.rotation.x += 0.05 * (targetX - group.rotation.x + 0.2);
        group.rotation.z += 0.05 * (targetY - group.rotation.z);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
