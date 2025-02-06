// js/app.js
import { AudioEngine } from "./audioEngine.js";
import { FrequencyController, VolumeController } from "./canvasController.js";
import { PresetManager } from "./presetManager.js";

// Constants
const segments = 10;
const canvasWidth = 600;
const canvasHeight = 200;
const minFreq = 100;
const maxFreq = 5000;

// Initialize controllers
const freqCanvas = document.getElementById("freqCanvas");
const volCanvas = document.getElementById("volCanvas");

const frequencyController = new FrequencyController(freqCanvas, segments, canvasWidth, canvasHeight, minFreq, maxFreq);
const volumeController = new VolumeController(volCanvas, segments, canvasWidth, canvasHeight);

// Draw initial canvases
frequencyController.draw();
volumeController.draw();

// Maintain a baseline copy for global frequency adjustments.
let freqBasePoints = frequencyController.points.slice();

// Global frequency slider
const globalFreqSlider = document.getElementById("globalFreqSlider");
const globalFreqValueDisplay = document.getElementById("globalFreqValue");
globalFreqSlider.addEventListener("input", (e) => {
    const factor = parseFloat(e.target.value);
    globalFreqValueDisplay.textContent = factor.toFixed(2);
    for (let i = 0; i < segments; i++) {
        frequencyController.points[i] = Math.min(maxFreq, Math.max(minFreq, freqBasePoints[i] * factor));
    }
    frequencyController.draw();
});

// Reset baseline when dragging stops
frequencyController.canvas.addEventListener("mouseup", () => {
    freqBasePoints = frequencyController.points.slice();
    globalFreqSlider.value = 1;
    globalFreqValueDisplay.textContent = "1.00";
});
frequencyController.canvas.addEventListener("mouseleave", () => {
    freqBasePoints = frequencyController.points.slice();
    globalFreqSlider.value = 1;
    globalFreqValueDisplay.textContent = "1.00";
});

// Audio engine instance
const audioEngine = new AudioEngine();

// Catmull-Rom interpolation function
function catmullRomInterpolate(t, p0, p1, p2, p3) {
    return 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
    );
}

// Generate smooth curves from control points.
function generateCurve(points, resolution) {
    const n = points.length;
    const curve = new Float32Array(resolution);
    for (let i = 0; i < resolution; i++) {
        const x = (i / (resolution - 1)) * (n - 1);
        const seg = Math.floor(x);
        const t = x - seg;
        const p0 = points[Math.max(seg - 1, 0)];
        const p1 = points[seg];
        const p2 = points[Math.min(seg + 1, n - 1)];
        const p3 = points[Math.min(seg + 2, n - 1)];
        curve[i] = catmullRomInterpolate(t, p0, p1, p2, p3);
    }
    return curve;
}

// Play button event
document.getElementById("playCustom").addEventListener("click", () => {
    const duration = parseFloat(document.getElementById("durationInput").value);
    if (isNaN(duration) || duration <= 0) {
        alert("Please enter a valid duration.");
        return;
    }
    const resolution = 1000;
    const freqCurve = generateCurve(frequencyController.points, resolution);
    const volCurve = generateCurve(volumeController.points, resolution);
    audioEngine.playSound(freqCurve, volCurve, duration);
});

// Export WAV button event
document.getElementById("exportWav").addEventListener("click", () => {
    const duration = parseFloat(document.getElementById("durationInput").value);
    if (isNaN(duration) || duration <= 0) {
        alert("Please enter a valid duration.");
        return;
    }
    const resolution = 1000;
    const freqCurve = generateCurve(frequencyController.points, resolution);
    const volCurve = generateCurve(volumeController.points, resolution);
    audioEngine.exportSound(freqCurve, volCurve, duration)
        .then((wavBlob) => {
            const url = URL.createObjectURL(wavBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'custom_sound.wav';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
});

// Built-in presets
const builtinPresets = {
    buttonClick: {
        duration: 0.1,
        freq: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
        volume: [0.7, 0.2, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    onDoneBeep: {
        duration: 0.2,
        freq: [500, 510, 520, 530, 540, 550, 560, 570, 580, 600],
        volume: [0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0.02, 0]
    },
    error: {
        duration: 0.4,
        freq: [600, 570, 540, 510, 480, 450, 420, 390, 360, 300],
        volume: [1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0]
    },
    notification: {
        duration: 0.3,
        freq: [800, 800, 800, 800, 800, 800, 800, 800, 800, 800],
        volume: [0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0]
    }
};

document.querySelectorAll(".preset-button").forEach(button => {
    button.addEventListener("click", (e) => {
        const presetKey = e.target.dataset.preset;
        const preset = builtinPresets[presetKey];
        if (!preset) return;
        document.getElementById("durationInput").value = preset.duration;
        // Update controllers with preset values.
        frequencyController.points = preset.freq.slice();
        volumeController.points = preset.volume.slice();
        freqBasePoints = frequencyController.points.slice();
        globalFreqSlider.value = 1;
        globalFreqValueDisplay.textContent = "1.00";
        frequencyController.draw();
        volumeController.draw();
        const resolution = 1000;
        const freqCurve = generateCurve(frequencyController.points, resolution);
        const volCurve = generateCurve(volumeController.points, resolution);
        audioEngine.playSound(freqCurve, volCurve, preset.duration);
    });
});

// Custom presets manager
const presetManager = new PresetManager(builtinPresets);
const customPresetsContainer = document.getElementById("customPresetsContainer");

function renderCustomPresets() {
    customPresetsContainer.innerHTML = "";
    const presets = presetManager.getCustomPresets();
    presets.forEach((preset, index) => {
        const presetDiv = document.createElement("div");
        presetDiv.classList.add("custom-preset-item");
        presetDiv.style.border = "1px solid #ccc";
        presetDiv.style.borderRadius = "4px";
        presetDiv.style.padding = "5px";
        presetDiv.style.margin = "5px";
        presetDiv.style.display = "flex";
        presetDiv.style.alignItems = "center";

        const presetButton = document.createElement("button");
        presetButton.textContent = preset.name;
        presetButton.className = "custom-preset-button";
        presetButton.addEventListener("click", () => {
            document.getElementById("durationInput").value = preset.duration;
            frequencyController.points = preset.freq.slice();
            volumeController.points = preset.volume.slice();
            freqBasePoints = frequencyController.points.slice();
            globalFreqSlider.value = 1;
            globalFreqValueDisplay.textContent = "1.00";
            frequencyController.draw();
            volumeController.draw();
            const resolution = 1000;
            const freqCurve = generateCurve(frequencyController.points, resolution);
            const volCurve = generateCurve(volumeController.points, resolution);
            audioEngine.playSound(freqCurve, volCurve, preset.duration);
        });

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-button";
        editButton.addEventListener("click", () => {
            const newName = prompt("Enter new preset name:", preset.name);
            if (newName && newName.trim() !== "") {
                preset.name = newName.trim();
                const presetsArray = presetManager.getCustomPresets();
                presetsArray[index] = preset;
                presetManager.saveCustomPresets(presetsArray);
                renderCustomPresets();
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";
        deleteButton.addEventListener("click", () => {
            if (confirm("Delete preset '" + preset.name + "'?")) {
                presetManager.deleteCustomPreset(index);
                renderCustomPresets();
            }
        });

        presetDiv.appendChild(presetButton);
        presetDiv.appendChild(editButton);
        presetDiv.appendChild(deleteButton);
        customPresetsContainer.appendChild(presetDiv);
    });
}

// Save preset button event
document.getElementById("savePreset").addEventListener("click", () => {
    const nameInput = document.getElementById("presetNameInput");
    const presetName = nameInput.value.trim();
    if (!presetName) {
        alert("Please enter a preset name.");
        return;
    }
    const duration = parseFloat(document.getElementById("durationInput").value);
    if (isNaN(duration) || duration <= 0) {
        alert("Invalid duration.");
        return;
    }
    const newPreset = {
        name: presetName,
        duration: duration,
        freq: frequencyController.points.slice(),
        volume: volumeController.points.slice()
    };
    presetManager.addCustomPreset(newPreset);
    nameInput.value = "";
    renderCustomPresets();
});

// Render custom presets on page load
renderCustomPresets();
