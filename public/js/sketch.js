// WYRM Grid Engine - Fixed Foundation with Wave Effects
let audio, fft, p5Canvas, capturer;
let logoImg;
let isRecording = false;
let savedPresets = {};

// Grid configuration
let gridSize = 30;
let cols = 30;
let rows = 30;
let waveOffset = [];

// Camera state - properly tracked
let cameraDistance = 600;
let cameraHeight = 400;
let cameraAngle = 45;
let cameraZoom = 1.0;

// Visual settings
let gridColor = '#00FF9E';
let waveColor = '#FFFFFF';
let glowColor = '#00FFFF';
let backgroundColor = '#000000';
let waveHeightMax = 150;
let sensitivity = 1.0;
let smoothing = 0.85;
let lineWidth = 1.5;
let showGlow = true;

function setup() {
    console.log("WYRM Grid Engine: Initializing...");
    
    const wrapper = document.getElementById('visualizer-wrapper');
    p5Canvas = createCanvas(1280, 720, WEBGL);
    p5Canvas.parent(wrapper);
    
    smooth();
    
    // Initialize FFT
    fft = new p5.FFT(smoothing, 256);
    
    // Initialize wave offset array
    for (let i = 0; i < cols * rows; i++) {
        waveOffset[i] = 0;
    }
    
    // Setup all controls with proper wiring
    setupAllControls();
    
    // Handle canvas sizing
    handleCanvasResize();
    
    console.log("WYRM Grid Engine: Ready!");
}

function draw() {
    background(backgroundColor);
    
    // Apply camera settings - PROPERLY WIRED
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
    
    // Lighting setup
    ambientLight(80);
    directionalLight(255, 255, 255, 0.3, 0.5, -1);
    
    // Audio-reactive glow
    if (showGlow) {
        const bass = audio && audio.isPlaying() ? fft.getEnergy("bass") : 
                    (sin(frameCount * 0.02) * 0.5 + 0.5) * 100;
        const glowIntensity = map(bass, 0, 255, 0, 0.8);
        const gc = color(glowColor);
        pointLight(
            red(gc) * glowIntensity,
            green(gc) * glowIntensity,
            blue(gc) * glowIntensity,
            0, -200, 200
        );
    }
    
    // Get audio spectrum
    let spectrum = [];
    if (audio && audio.isPlaying()) {
        spectrum = fft.analyze();
    } else {
        // Demo mode - subtle waves
        for (let i = 0; i < 256; i++) {
            spectrum[i] = 
                sin(frameCount * 0.01 + i * 0.1) * 40 +
                cos(frameCount * 0.015 - i * 0.05) * 30 +
                noise(i * 0.02, frameCount * 0.002) * 50 + 60;
        }
    }
    
    // Update wave offsets (not the grid itself)
    updateWaveOffsets(spectrum);
    
    // Draw the grid
    push();
    translate(-cols * gridSize / 2, 0, -rows * gridSize / 2);
    
    // Draw base grid at y=0 with wave effects
    drawStableGrid();
    
    // Draw glow effects on peaks
    if (showGlow) {
        drawGlowEffects();
    }
    
    pop();
    
    // UI elements
    drawUI();
    
    // Recording
    if (isRecording && capturer) {
        capturer.capture(canvas);
    }
}

function updateWaveOffsets(spectrum) {
    const centerX = cols / 2;
    const centerY = rows / 2;
    const maxDist = dist(0, 0, centerX, centerY);
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const index = y * cols + x;
            
            // Distance from center
            const d = dist(x, y, centerX, centerY);
            
            // Create ripple pattern from center
            const ripplePhase = d * 0.15 - frameCount * 0.02;
            const rippleAmount = sin(ripplePhase) * 0.4 + 0.6;
            
            // Map distance to frequency band
            const freqIndex = floor(map(d, 0, maxDist, 0, spectrum.length / 4));
            const audioValue = spectrum[freqIndex] || 0;
            
            // Calculate wave height offset
            const targetOffset = map(audioValue, 0, 255, 0, waveHeightMax) * 
                               sensitivity * rippleAmount;
            
            // Smooth interpolation
            waveOffset[index] = lerp(waveOffset[index], targetOffset, 1 - smoothing);
        }
    }
}

function drawStableGrid() {
    stroke(gridColor);
    strokeWeight(lineWidth);
    noFill();
    
    // Draw horizontal lines - grid stays at y=0, only wave offset applied
    for (let y = 0; y < rows; y++) {
        beginShape();
        for (let x = 0; x < cols; x++) {
            const offset = waveOffset[y * cols + x];
            vertex(x * gridSize, -offset, y * gridSize);
        }
        endShape();
    }
    
    // Draw vertical lines
    for (let x = 0; x < cols; x++) {
        beginShape();
        for (let y = 0; y < rows; y++) {
            const offset = waveOffset[y * cols + x];
            vertex(x * gridSize, -offset, y * gridSize);
        }
        endShape();
    }
    
    // Draw corner points for reference (like first version)
    push();
    strokeWeight(3);
    stroke(waveColor);
    
    // Corner markers
    point(0, 0, 0);
    point((cols-1) * gridSize, 0, 0);
    point(0, 0, (rows-1) * gridSize);
    point((cols-1) * gridSize, 0, (rows-1) * gridSize);
    pop();
}

function drawGlowEffects() {
    push();
    strokeWeight(4);
    
    // Glow on wave peaks
    for (let y = 1; y < rows-1; y += 3) {
        for (let x = 1; x < cols-1; x += 3) {
            const offset = waveOffset[y * cols + x];
            
            if (offset > waveHeightMax * 0.6) {
                const intensity = map(offset, waveHeightMax * 0.6, waveHeightMax, 0, 1);
                const c = lerpColor(
                    color(gridColor),
                    color(glowColor),
                    intensity
                );
                stroke(c);
                point(x * gridSize, -offset, y * gridSize);
                
                // Extra glow for high peaks
                if (offset > waveHeightMax * 0.85) {
                    strokeWeight(6);
                    stroke(red(c), green(c), blue(c), 100);
                    point(x * gridSize, -offset - 5, y * gridSize);
                    strokeWeight(4);
                }
            }
        }
    }
    pop();
}

function drawUI() {
    if (logoImg) {
        push();
        camera();
        translate(-width/2, -height/2, 0);
        const size = width / 10;
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
            const maxW = container.clientWidth - 40;
            const maxH = container.clientHeight - 40;
            const scale = Math.min(maxW / w, maxH / h);
            
            p5Canvas.style('width', (w * scale) + 'px');
            p5Canvas.style('height', (h * scale) + 'px');
        }
    }
}

function setupAllControls() {
    console.log("Setting up all controls...");
    
    // Audio controls
    const audioFile = document.getElementById('audio-file');
    if (audioFile) {
        audioFile.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                if (audio) audio.stop();
                audio = loadSound(URL.createObjectURL(e.target.files[0]), () => {
                    console.log("Audio loaded!");
                });
            }
        });
    }
    
    const playBtn = document.getElementById('play-pause-button');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (audio && audio.isLoaded()) {
                if (audio.isPlaying()) {
                    audio.pause();
                    this.textContent = 'Play';
                } else {
                    audio.loop();
                    this.textContent = 'Pause';
                }
            }
        });
    }
    
    // COLOR CONTROLS - PROPERLY WIRED
    const gridColorInput = document.getElementById('gridColor');
    if (gridColorInput) {
        gridColorInput.value = gridColor;
        gridColorInput.addEventListener('input', (e) => {
            gridColor = e.target.value;
            console.log("Grid color:", gridColor);
        });
    }
    
    const waveColorInput = document.getElementById('waveColor');
    if (waveColorInput) {
        waveColorInput.value = waveColor;
        waveColorInput.addEventListener('input', (e) => {
            waveColor = e.target.value;
            console.log("Wave color:", waveColor);
        });
    }
    
    const glowColorInput = document.getElementById('glowColor');
    if (glowColorInput) {
        glowColorInput.value = glowColor;
        glowColorInput.addEventListener('input', (e) => {
            glowColor = e.target.value;
            console.log("Glow color:", glowColor);
        });
    }
    
    const bgColorInput = document.getElementById('bgColor1');
    if (bgColorInput) {
        bgColorInput.value = backgroundColor;
        bgColorInput.addEventListener('input', (e) => {
            backgroundColor = e.target.value;
            console.log("Background:", backgroundColor);
        });
    }
    
    // GRID SETTINGS - PROPERLY WIRED
    const gridDensityInput = document.getElementById('gridDensity');
    if (gridDensityInput) {
        gridDensityInput.addEventListener('input', (e) => {
            const density = parseInt(e.target.value);
            cols = rows = density;
            gridSize = map(density, 10, 50, 40, 15);
            
            // Reinitialize wave offsets
            waveOffset = [];
            for (let i = 0; i < cols * rows; i++) {
                waveOffset[i] = 0;
            }
            console.log("Grid density:", cols + "x" + rows);
        });
    }
    
    const waveHeightInput = document.getElementById('waveHeight');
    if (waveHeightInput) {
        waveHeightInput.value = waveHeightMax;
        waveHeightInput.addEventListener('input', (e) => {
            waveHeightMax = parseFloat(e.target.value);
            console.log("Wave height:", waveHeightMax);
        });
    }
    
    const lineWidthInput = document.getElementById('lineWidth');
    if (lineWidthInput) {
        lineWidthInput.value = lineWidth;
        lineWidthInput.addEventListener('input', (e) => {
            lineWidth = parseFloat(e.target.value);
            console.log("Line width:", lineWidth);
        });
    }
    
    // CAMERA CONTROLS - FULLY WIRED
    const camModeSelect = document.getElementById('cameraMode');
    if (camModeSelect) {
        camModeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            console.log("Camera mode:", mode);
            
            if (mode === 'orbit') {
                // Start auto rotation
                window.autoRotate = true;
            } else {
                window.autoRotate = false;
            }
        });
    }
    
    const camDistInput = document.getElementById('cameraDistance');
    if (camDistInput) {
        camDistInput.value = cameraDistance;
        camDistInput.addEventListener('input', (e) => {
            cameraDistance = parseFloat(e.target.value);
            console.log("Camera distance:", cameraDistance);
        });
    }
    
    const camHeightInput = document.getElementById('cameraHeight');
    if (camHeightInput) {
        camHeightInput.value = cameraHeight;
        camHeightInput.addEventListener('input', (e) => {
            cameraHeight = parseFloat(e.target.value);
            console.log("Camera height:", cameraHeight);
        });
    }
    
    const camAngleInput = document.getElementById('cameraAngle');
    if (camAngleInput) {
        camAngleInput.value = cameraAngle;
        camAngleInput.addEventListener('input', (e) => {
            cameraAngle = parseFloat(e.target.value);
            console.log("Camera angle:", cameraAngle);
        });
    }
    
    // AUDIO RESPONSE
    const sensitivityInput = document.getElementById('sensitivity');
    if (sensitivityInput) {
        sensitivityInput.value = sensitivity;
        sensitivityInput.addEventListener('input', (e) => {
            sensitivity = parseFloat(e.target.value);
            console.log("Sensitivity:", sensitivity);
        });
    }
    
    const smoothingInput = document.getElementById('smoothing');
    if (smoothingInput) {
        smoothingInput.value = smoothing;
        smoothingInput.addEventListener('input', (e) => {
            smoothing = parseFloat(e.target.value);
            if (fft) fft.smooth(smoothing);
            console.log("Smoothing:", smoothing);
        });
    }
    
    const reactiveGlowInput = document.getElementById('reactiveGlow');
    if (reactiveGlowInput) {
        reactiveGlowInput.addEventListener('input', (e) => {
            cameraZoom = map(parseFloat(e.target.value), 0, 1, 0.5, 1.5);
            console.log("Zoom:", cameraZoom);
        });
    }
    
    // EFFECTS
    const showGlowCheck = document.getElementById('showGlow');
    if (showGlowCheck) {
        showGlowCheck.checked = showGlow;
        showGlowCheck.addEventListener('change', (e) => {
            showGlow = e.target.checked;
            console.log("Show glow:", showGlow);
        });
    }
    
    // Logo
    const logoInput = document.getElementById('logoUpload');
    if (logoInput) {
        logoInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    loadImage(event.target.result, (img) => {
                        logoImg = img;
                        console.log("Logo loaded!");
                    });
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    // Recording
    const startRecBtn = document.getElementById('start-recording-button');
    if (startRecBtn) {
        startRecBtn.addEventListener('click', function() {
            if (!isRecording) {
                isRecording = true;
                const [w, h] = document.getElementById('resolution-select').value.split('x').map(Number);
                capturer = new CCapture({
                    format: 'webm',
                    framerate: 60,
                    verbose: true
                });
                capturer.start();
                this.style.borderColor = '#ff1493';
            }
        });
    }
    
    const stopRecBtn = document.getElementById('stop-recording-button');
    if (stopRecBtn) {
        stopRecBtn.addEventListener('click', function() {
            if (isRecording) {
                isRecording = false;
                capturer.stop();
                capturer.save();
                document.getElementById('start-recording-button').style.borderColor = '';
            }
        });
    }
    
    // Resolution
    const resSelect = document.getElementById('resolution-select');
    if (resSelect) {
        resSelect.addEventListener('change', handleCanvasResize);
    }
    
    // Presets
    const saveBtn = document.getElementById('savePreset');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePreset);
    }
    
    const loadSelect = document.getElementById('loadPreset');
    if (loadSelect) {
        loadSelect.addEventListener('change', loadPreset);
    }
    
    // Load saved presets
    loadPresetsFromStorage();
    
    // Auto-rotation in draw() when orbit mode is selected
    window.autoRotate = false;
}

// Update camera angle if auto-rotating
function updateCameraForAutoRotate() {
    if (window.autoRotate) {
        cameraAngle += 0.3;
        if (cameraAngle > 180) cameraAngle = -180;
    }
}

// Call this in draw() before setting camera
draw = (function() {
    const originalDraw = draw;
    return function() {
        updateCameraForAutoRotate();
        originalDraw.apply(this, arguments);
    };
})();

// Preset management
function savePreset() {
    const name = document.getElementById('presetName').value.trim();
    if (name) {
        savedPresets[name] = {
            gridColor,
            waveColor,
            glowColor,
            backgroundColor,
            waveHeightMax,
            sensitivity,
            smoothing,
            lineWidth,
            showGlow,
            cameraDistance,
            cameraHeight,
            cameraAngle,
            cameraZoom,
            cols,
            rows,
            gridSize
        };
        localStorage.setItem('wyrm_grid_presets', JSON.stringify(savedPresets));
        updatePresetList();
        document.getElementById('presetName').value = '';
        console.log("Preset saved:", name);
    }
}

function loadPreset() {
    const name = document.getElementById('loadPreset').value;
    if (name && savedPresets[name]) {
        const p = savedPresets[name];
        
        // Load all values
        gridColor = p.gridColor || gridColor;
        waveColor = p.waveColor || waveColor;
        glowColor = p.glowColor || glowColor;
        backgroundColor = p.backgroundColor || backgroundColor;
        waveHeightMax = p.waveHeightMax || waveHeightMax;
        sensitivity = p.sensitivity || sensitivity;
        smoothing = p.smoothing || smoothing;
        lineWidth = p.lineWidth || lineWidth;
        showGlow = p.showGlow !== undefined ? p.showGlow : showGlow;
        cameraDistance = p.cameraDistance || cameraDistance;
        cameraHeight = p.cameraHeight || cameraHeight;
        cameraAngle = p.cameraAngle || cameraAngle;
        cameraZoom = p.cameraZoom || cameraZoom;
        
        if (p.cols) {
            cols = p.cols;
            rows = p.rows;
            gridSize = p.gridSize;
            
            // Reinitialize
            waveOffset = [];
            for (let i = 0; i < cols * rows; i++) {
                waveOffset[i] = 0;
            }
        }
        
        // Update UI
        updateControlsUI();
        
        console.log("Preset loaded:", name);
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
    if (select) {
        select.innerHTML = '<option value="">Load Preset...</option>';
        Object.keys(savedPresets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }
}

function updateControlsUI() {
    // Update all inputs to match current values
    const inputs = {
        'gridColor': gridColor,
        'waveColor': waveColor,
        'glowColor': glowColor,
        'bgColor1': backgroundColor,
        'waveHeight': waveHeightMax,
        'lineWidth': lineWidth,
        'cameraDistance': cameraDistance,
        'cameraHeight': cameraHeight,
        'cameraAngle': cameraAngle,
        'sensitivity': sensitivity,
        'smoothing': smoothing
    };
    
    Object.keys(inputs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = inputs[id];
    });
    
    const glowCheck = document.getElementById('showGlow');
    if (glowCheck) glowCheck.checked = showGlow;
}