// WYRM Grid Engine - Wrapped in DOMContentLoaded to ensure page elements are loaded first.

window.addEventListener('DOMContentLoaded', () => {
    let audio, fft, p5Canvas, capturer;
    let logoImg;
    let isRecording = false;
    let savedPresets = {};

    // Grid configuration
    let gridSize = 30;
    let cols = 30;
    let rows = 30;
    let waveOffset = [];

    // Camera state
    let cameraDistance = 600;
    let cameraHeight = 400;
    let cameraAngle = 45;
    let cameraZoom = 1.0;    // Visual settings
    let gridColor = '#00FF9E';
    let waveColor = '#FFFFFF';
    let glowColor = '#00FFFF';
    let backgroundColor = '#000000';
    let waveHeightMax = 150;
    let sensitivity = 1.0;
    let smoothing = 0.85;
    let lineWidth = 1.5;
    let showGlow = true;
    let showMirror = false;    let showParticles = false;
    let reactiveGlowIntensity = 0.7;
    let particles = [];

    function setup() {
        console.log("WYRM Grid Engine: Initializing...");
        
        const wrapper = document.getElementById('visualizer-wrapper');
        // Default canvas size, will be resized by handleCanvasResize
        p5Canvas = createCanvas(1280, 720, WEBGL);
        p5Canvas.parent(wrapper);
        
        smooth();
        
        fft = new p5.FFT(smoothing, 256);
        
        for (let i = 0; i < cols * rows; i++) {
            waveOffset[i] = 0;
        }
        
        setupAllControls();
        handleCanvasResize();
        
        console.log("WYRM Grid Engine: Ready!");
    }

    function draw() {
        background(backgroundColor);
        
        updateCameraForAutoRotate();
        
        const camDist = cameraDistance * cameraZoom;
        const camHeight = cameraHeight * cameraZoom;
        const angle = radians(cameraAngle);
        
        camera(
            sin(angle) * camDist,
            -camHeight,
            cos(angle) * camDist,
            0, 0, 0,
            0, 1, 0
        );
        
        ambientLight(80);
        directionalLight(255, 255, 255, 0.3, 0.5, -1);        if (showGlow) {
            const bass = audio && audio.isPlaying() ? fft.getEnergy("bass") : 
                        (sin(frameCount * 0.02) * 0.5 + 0.5) * 100;
            const glowIntensity = map(bass, 0, 255, 0, 1.0) * reactiveGlowIntensity;
            const gc = color(glowColor);
            pointLight(
                red(gc) * glowIntensity * 255,
                green(gc) * glowIntensity * 255,
                blue(gc) * glowIntensity * 255,
                0, -200, 200
            );
            
            // Add additional ambient glow based on reactive intensity
            ambientLight(50 + glowIntensity * 30);
        }
        
        let spectrum = [];
        if (audio && audio.isPlaying()) {
            spectrum = fft.analyze();
        } else {
            for (let i = 0; i < 256; i++) {
                spectrum[i] = 
                    sin(frameCount * 0.01 + i * 0.1) * 40 +
                    cos(frameCount * 0.015 - i * 0.05) * 30 +
                    noise(i * 0.02, frameCount * 0.002) * 50 + 60;
            }
        }
        
        updateWaveOffsets(spectrum);
          push();
        translate(-cols * gridSize / 2, 0, -rows * gridSize / 2);
        
        drawStableGrid();
        
        if (showMirror) {
            drawMirroredGrid();
        }
        
        if (showGlow) {
            drawGlowEffects();
        }
        
        if (showParticles) {
            drawParticles();
        }
        
        pop();
          drawUI();
        
        // Update play button state periodically
        if (frameCount % 30 === 0) { // Every 30 frames (about twice per second)
            updatePlayButton();
        }
        
        if (isRecording && capturer) {
            capturer.capture(p5Canvas.elt);
        }
    }

    function updateWaveOffsets(spectrum) {
        const centerX = cols / 2;
        const centerY = rows / 2;
        const maxDist = dist(0, 0, centerX, centerY);
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const index = y * cols + x;
                const d = dist(x, y, centerX, centerY);
                const ripplePhase = d * 0.15 - frameCount * 0.02;
                const rippleAmount = sin(ripplePhase) * 0.4 + 0.6;
                const freqIndex = floor(map(d, 0, maxDist, 0, spectrum.length / 4));
                const audioValue = spectrum[freqIndex] || 0;
                const targetOffset = map(audioValue, 0, 255, 0, waveHeightMax) * sensitivity * rippleAmount;
                waveOffset[index] = lerp(waveOffset[index], targetOffset, 1 - smoothing);
            }
        }
    }

    function drawStableGrid() {
        stroke(gridColor);
        strokeWeight(lineWidth);
        noFill();
        
        for (let y = 0; y < rows; y++) {
            beginShape();
            for (let x = 0; x < cols; x++) {
                const offset = waveOffset[y * cols + x];
                vertex(x * gridSize, -offset, y * gridSize);
            }
            endShape();
        }
        
        for (let x = 0; x < cols; x++) {
            beginShape();
            for (let y = 0; y < rows; y++) {
                const offset = waveOffset[y * cols + x];
                vertex(x * gridSize, -offset, y * gridSize);
            }
            endShape();
        }
        
        push();
        strokeWeight(3);
        stroke(waveColor);
        point(0, 0, 0);
        point((cols-1) * gridSize, 0, 0);
        point(0, 0, (rows-1) * gridSize);
        point((cols-1) * gridSize, 0, (rows-1) * gridSize);
        pop();
    }    function drawGlowEffects() {
        push();
        strokeWeight(4);
        
        // Get current bass energy for reactive effects
        const bass = audio && audio.isPlaying() ? fft.getEnergy("bass") : 
                    (sin(frameCount * 0.02) * 0.5 + 0.5) * 100;
        const reactiveMultiplier = map(bass, 0, 255, 0.3, 1.0) * reactiveGlowIntensity;
        
        for (let y = 1; y < rows-1; y += 3) {
            for (let x = 1; x < cols-1; x += 3) {
                const offset = waveOffset[y * cols + x];
                
                if (offset > waveHeightMax * 0.6) {
                    const intensity = map(offset, waveHeightMax * 0.6, waveHeightMax, 0, 1) * reactiveMultiplier;
                    const c = lerpColor(color(gridColor), color(glowColor), intensity);
                    stroke(c);
                    point(x * gridSize, -offset, y * gridSize);
                    
                    if (offset > waveHeightMax * 0.85) {
                        strokeWeight(6);
                        stroke(red(c), green(c), blue(c), intensity * 150);
                        point(x * gridSize, -offset - 5, y * gridSize);
                        strokeWeight(4);
                        
                        // Add extra glow for very high peaks
                        if (reactiveGlowIntensity > 0.5) {
                            strokeWeight(8);
                            stroke(red(c), green(c), blue(c), intensity * 80);
                            point(x * gridSize, -offset - 10, y * gridSize);
                            strokeWeight(4);
                        }
                    }
                }
            }
        }
        pop();
    }

    function drawMirroredGrid() {
        push();
        translate(cols * gridSize, 0, 0);
        scale(-1, 1, 1);
        
        stroke(gridColor);
        strokeWeight(lineWidth);
        noFill();
        
        // Draw mirrored horizontal lines
        for (let y = 0; y < rows; y++) {
            beginShape();
            for (let x = 0; x < cols; x++) {
                const offset = waveOffset[y * cols + x];
                vertex(x * gridSize, -offset, y * gridSize);
            }
            endShape();
        }
        
        // Draw mirrored vertical lines
        for (let x = 0; x < cols; x++) {
            beginShape();
            for (let y = 0; y < rows; y++) {
                const offset = waveOffset[y * cols + x];
                vertex(x * gridSize, -offset, y * gridSize);
            }
            endShape();
        }
        pop();
    }    function drawParticles() {
        // Update and create particles based on grid activity
        updateParticleSystem();
        
        push();
        noStroke();
        
        // Draw all active particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Update particle position
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            p.life -= p.decay;
            p.size *= p.sizeDecay;
            
            // Remove dead particles
            if (p.life <= 0 || p.size < 0.5) {
                particles.splice(i, 1);
                continue;
            }
            
            // Draw particle with glow effect
            const alpha = map(p.life, 0, 1, 0, 255);
            fill(p.r, p.g, p.b, alpha);
            
            push();
            translate(p.x, p.y, p.z);
            
            // Different particle types
            if (p.type === 'sphere') {
                sphere(p.size);
            } else if (p.type === 'cube') {
                box(p.size);
            } else if (p.type === 'trail') {
                // Create trailing effect
                for (let j = 0; j < 3; j++) {
                    fill(p.r, p.g, p.b, alpha * (1 - j * 0.3));
                    push();
                    translate(-p.vx * j * 2, -p.vy * j * 2, -p.vz * j * 2);
                    sphere(p.size * (1 - j * 0.2));
                    pop();
                }
            }
            pop();
        }
        pop();
    }
    
    function updateParticleSystem() {
        // Create new particles based on grid activity
        for (let y = 0; y < rows; y += 3) {
            for (let x = 0; x < cols; x += 3) {
                const offset = waveOffset[y * cols + x];
                
                if (offset > waveHeightMax * 0.4 && random() < 0.1) { // 10% chance per frame
                    const intensity = map(offset, waveHeightMax * 0.4, waveHeightMax, 0, 1);
                    const particleColor = lerpColor(color(gridColor), color(glowColor), intensity);
                    
                    // Different particle types based on intensity
                    let particleType = 'sphere';
                    if (intensity > 0.7) particleType = 'trail';
                    else if (intensity > 0.5) particleType = 'cube';
                    
                    const particle = {
                        x: x * gridSize,
                        y: -offset - random(10, 30),
                        z: y * gridSize,
                        vx: random(-2, 2),
                        vy: random(-5, -1), // Upward movement
                        vz: random(-2, 2),
                        r: red(particleColor),
                        g: green(particleColor),
                        b: blue(particleColor),
                        size: random(2, 6) * intensity,
                        life: 1.0,
                        decay: random(0.005, 0.02),
                        sizeDecay: random(0.98, 0.995),
                        type: particleType
                    };
                    
                    particles.push(particle);
                }
            }
        }
        
        // Limit particle count for performance
        if (particles.length > 200) {
            particles.splice(0, particles.length - 200);
        }
    }

    function drawUI() {
        if (logoImg) {
            push();
            camera(); // Reset camera for 2D overlay
            translate(-width/2, -height/2, 0);
            const size = width / 12;
            image(logoImg, width - size - 20, height - size - 20, size, size);
            pop();
        }
    }

    function handleCanvasResize() {
        const select = document.getElementById('resolution-select');
        if (select) {
            const [w, h] = select.value.split('x').map(Number);
            resizeCanvas(w, h);
            
            const container = document.getElementById('canvas-container');
            if (container) {
                const maxW = container.clientWidth - 20; // accounting for padding
                const maxH = container.clientHeight - 20;
                const scale = Math.min(maxW / w, maxH / h, 1);
                
                p5Canvas.style('width', (w * scale) + 'px');
                p5Canvas.style('height', (h * scale) + 'px');
            }
        }
    }    function setupAllControls() {        document.getElementById('audio-file').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                
                // Validate file type
                const audioTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac'];
                const isAudioFile = audioTypes.some(type => file.type.startsWith(type)) || 
                                  /\.(mp3|mp4|wav|ogg|m4a|aac|flac|wma)$/i.test(file.name);
                
                if (!isAudioFile) {
                    alert('Please select a valid audio file (.mp3, .wav, .ogg, .mp4, .m4a, .aac, .flac, .wma)');
                    e.target.value = ''; // Clear the input
                    return;
                }
                
                if (audio) audio.stop();
                audio = loadSound(URL.createObjectURL(file), () => {
                    console.log('Audio loaded successfully:', file.name);
                    audio.setVolume(parseFloat(document.getElementById('volume-control').value));
                    updatePlayButton();
                }, (error) => {
                    console.error('Error loading audio:', error);
                    alert('Error loading audio file. Please try a different file.');
                });
            }
        });
        
        document.getElementById('play-pause-button').addEventListener('click', function() {
            if (audio && audio.isLoaded()) {
                if (audio.isPlaying()) {
                    audio.pause();
                } else {
                    audio.loop();
                }
                updatePlayButton();
            }
        });
        
        document.getElementById('restart-button').addEventListener('click', function() {
            if (audio && audio.isLoaded()) {
                audio.stop();
                audio.jump(0);
                if (audio.isPlaying()) {
                    audio.loop();
                }
                updatePlayButton();
            }
        });
        
        document.getElementById('rewind-button').addEventListener('click', function() {
            if (audio && audio.isLoaded()) {
                const currentTime = audio.currentTime();
                const newTime = Math.max(0, currentTime - 10); // Rewind 10 seconds
                audio.jump(newTime);
            }
        });
        
        document.getElementById('fast-forward-button').addEventListener('click', function() {
            if (audio && audio.isLoaded()) {
                const currentTime = audio.currentTime();
                const duration = audio.duration();
                const newTime = Math.min(duration, currentTime + 10); // Fast forward 10 seconds
                audio.jump(newTime);
            }
        });
        
        document.getElementById('volume-control').addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            if (audio && audio.isLoaded()) {
                audio.setVolume(volume);
            }
        });
          document.getElementById('gridColor').addEventListener('input', (e) => gridColor = e.target.value);
        document.getElementById('waveColor').addEventListener('input', (e) => waveColor = e.target.value);
        document.getElementById('glowColor').addEventListener('input', (e) => glowColor = e.target.value);
        document.getElementById('bgColor1').addEventListener('input', (e) => backgroundColor = e.target.value);
        document.getElementById('waveHeight').addEventListener('input', (e) => waveHeightMax = parseFloat(e.target.value));
        document.getElementById('lineWidth').addEventListener('input', (e) => lineWidth = parseFloat(e.target.value));
        document.getElementById('cameraDistance').addEventListener('input', (e) => cameraDistance = parseFloat(e.target.value));
        document.getElementById('cameraHeight').addEventListener('input', (e) => cameraHeight = parseFloat(e.target.value));
        document.getElementById('cameraAngle').addEventListener('input', (e) => cameraAngle = parseFloat(e.target.value));
        document.getElementById('sensitivity').addEventListener('input', (e) => sensitivity = parseFloat(e.target.value));
        document.getElementById('smoothing').addEventListener('input', (e) => {
            smoothing = parseFloat(e.target.value);
            fft.smooth(smoothing);
        });
        document.getElementById('reactiveGlow').addEventListener('input', (e) => reactiveGlowIntensity = parseFloat(e.target.value));
        document.getElementById('showGlow').addEventListener('change', (e) => showGlow = e.target.checked);
        document.getElementById('showMirror').addEventListener('change', (e) => showMirror = e.target.checked);
        document.getElementById('showParticles').addEventListener('change', (e) => showParticles = e.target.checked);
        
        document.getElementById('gridDensity').addEventListener('input', (e) => {
            const density = parseInt(e.target.value);
            cols = rows = density;
            gridSize = map(density, 10, 50, 40, 15);
            waveOffset = new Array(cols * rows).fill(0);
        });
        
        document.getElementById('logoUpload').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                loadImage(URL.createObjectURL(e.target.files[0]), (img) => logoImg = img);
            }
        });
          document.getElementById('recording-button').addEventListener('click', function() {
            if (!isRecording) {
                // Start recording
                isRecording = true;
                capturer = new CCapture({ format: 'webm', framerate: 60, verbose: true });
                capturer.start();
                this.textContent = 'Stop Recording';
                this.style.borderColor = '#ff1493';
                this.style.backgroundColor = '#ff1493';
            } else {
                // Stop recording
                isRecording = false;
                capturer.stop();
                capturer.save();
                this.textContent = 'Start Recording';
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
        
        document.getElementById('resolution-select').addEventListener('change', handleCanvasResize);
        document.getElementById('savePreset').addEventListener('click', savePreset);
        document.getElementById('loadPreset').addEventListener('change', loadPreset);
        
        loadPresetsFromStorage();
    }

    function updateCameraForAutoRotate() {
        if (document.getElementById('cameraMode').value === 'orbit') {
            cameraAngle += 0.2;
            if (cameraAngle > 180) cameraAngle -= 360;
        }
    }    function savePreset() {
        const name = document.getElementById('presetName').value.trim();
        if (name) {
            savedPresets[name] = { 
                gridColor, waveColor, glowColor, backgroundColor, waveHeightMax, 
                sensitivity, smoothing, lineWidth, showGlow, showMirror, showParticles,
                reactiveGlowIntensity, cameraDistance, cameraHeight, cameraAngle, 
                cameraZoom, cols 
            };
            localStorage.setItem('wyrm_grid_presets', JSON.stringify(savedPresets));
            updatePresetList();
            document.getElementById('presetName').value = '';
        }
    }    function loadPreset() {
        const name = document.getElementById('loadPreset').value;
        if (name && savedPresets[name]) {
            const p = savedPresets[name];
            gridColor = p.gridColor;
            waveColor = p.waveColor;
            glowColor = p.glowColor;
            backgroundColor = p.backgroundColor;
            waveHeightMax = p.waveHeightMax;
            sensitivity = p.sensitivity;
            smoothing = p.smoothing;
            lineWidth = p.lineWidth;
            showGlow = p.showGlow;
            showMirror = p.showMirror || false;
            showParticles = p.showParticles || false;
            reactiveGlowIntensity = p.reactiveGlowIntensity || 0.7;
            cameraDistance = p.cameraDistance;
            cameraHeight = p.cameraHeight;
            cameraAngle = p.cameraAngle;
            cameraZoom = p.cameraZoom;
            if (p.cols) {
                cols = rows = p.cols;
                gridSize = map(p.cols, 10, 50, 40, 15);
                waveOffset = new Array(cols * rows).fill(0);
            }
            updateControlsUI();
        }
    }

    function loadPresetsFromStorage() {
        const stored = localStorage.getItem('wyrm_grid_presets');
        if (stored) {
            savedPresets = JSON.parse(stored);
            updatePresetList();
        }
    }

    function updatePresetList() {
        const select = document.getElementById('loadPreset');
        select.innerHTML = '<option value="">Load Preset...</option>';
        Object.keys(savedPresets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }    function updateControlsUI() {
        const inputs = {
            'gridColor': gridColor, 'waveColor': waveColor, 'glowColor': glowColor,
            'bgColor1': backgroundColor, 'waveHeight': waveHeightMax, 'lineWidth': lineWidth,
            'cameraDistance': cameraDistance, 'cameraHeight': cameraHeight, 'cameraAngle': cameraAngle,
            'sensitivity': sensitivity, 'smoothing': smoothing, 'reactiveGlow': reactiveGlowIntensity,
            'gridDensity': cols, 'volume-control': 0.8
        };
        for (const [id, value] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if(el) el.value = value;
        }
        document.getElementById('showGlow').checked = showGlow;
        document.getElementById('showMirror').checked = showMirror;
        document.getElementById('showParticles').checked = showParticles;
    }function updatePlayButton() {
        const playBtn = document.getElementById('play-pause-button');
        if (audio && audio.isLoaded()) {
            if (audio.isPlaying()) {
                playBtn.textContent = 'Pause';
            } else {
                playBtn.textContent = 'Play';
            }
        }
    }

    // Assign p5.js functions to the global window object
    window.setup = setup;
    window.draw = draw;
});
