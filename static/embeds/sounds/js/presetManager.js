// js/presetManager.js
export class PresetManager {
    constructor(builtinPresets, customPresetsKey = "customPresets") {
        this.builtinPresets = builtinPresets;
        this.customPresetsKey = customPresetsKey;
    }

    getCustomPresets() {
        return JSON.parse(localStorage.getItem(this.customPresetsKey)) || [];
    }

    saveCustomPresets(presets) {
        localStorage.setItem(this.customPresetsKey, JSON.stringify(presets));
    }

    addCustomPreset(preset) {
        const presets = this.getCustomPresets();
        presets.push(preset);
        this.saveCustomPresets(presets);
    }

    updateCustomPreset(index, newPreset) {
        const presets = this.getCustomPresets();
        if (index >= 0 && index < presets.length) {
            presets[index] = newPreset;
            this.saveCustomPresets(presets);
        }
    }

    deleteCustomPreset(index) {
        const presets = this.getCustomPresets();
        if (index >= 0 && index < presets.length) {
            presets.splice(index, 1);
            this.saveCustomPresets(presets);
        }
    }
}
