// js/audioEngine.js
export class AudioEngine {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = 44100; // WAV export sample rate
    }

    playSound(freqCurve, volCurve, duration) {
        const currentTime = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueCurveAtTime(freqCurve, currentTime, duration);
        gainNode.gain.setValueCurveAtTime(volCurve, currentTime, duration);
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        osc.start(currentTime);
        osc.stop(currentTime + duration);
    }

    exportSound(freqCurve, volCurve, duration) {
        const sampleRate = this.sampleRate;
        const frameCount = duration * sampleRate;
        const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);
        const osc = offlineCtx.createOscillator();
        const gainNode = offlineCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueCurveAtTime(freqCurve, offlineCtx.currentTime, duration);
        gainNode.gain.setValueCurveAtTime(volCurve, offlineCtx.currentTime, duration);
        osc.connect(gainNode);
        gainNode.connect(offlineCtx.destination);
        osc.start(offlineCtx.currentTime);
        osc.stop(offlineCtx.currentTime + duration);

        return offlineCtx.startRendering().then((renderedBuffer) => {
            const wavBlob = this.audioBufferToWav(renderedBuffer);
            return wavBlob;
        });
    }

    audioBufferToWav(buffer, opt) {
        opt = opt || {};
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = opt.float32 ? 3 : 1;
        const bitDepth = format === 3 ? 32 : 16;
        let result;
        if (numChannels === 1) {
            result = buffer.getChannelData(0);
        } else {
            // For simplicity, we only handle mono output here.
            result = buffer.getChannelData(0);
        }
        return this.encodeWAV(result, numChannels, sampleRate, bitDepth);
    }

    encodeWAV(samples, numChannels, sampleRate, bitDepth) {
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        const view = new DataView(buffer);
        /* RIFF identifier */
        this.writeString(view, 0, 'RIFF');
        /* file length */
        view.setUint32(4, 36 + samples.length * bytesPerSample, true);
        /* RIFF type */
        this.writeString(view, 8, 'WAVE');
        /* format chunk identifier */
        this.writeString(view, 12, 'fmt ');
        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (PCM = 1) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, numChannels, true);
        /* sample rate */
        view.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, sampleRate * blockAlign, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, blockAlign, true);
        /* bits per sample */
        view.setUint16(34, bitDepth, true);
        /* data chunk identifier */
        this.writeString(view, 36, 'data');
        /* data chunk length */
        view.setUint32(40, samples.length * bytesPerSample, true);
        if (bitDepth === 16) {
            this.floatTo16BitPCM(view, 44, samples);
        } else {
            for (let i = 0; i < samples.length; i++) {
                view.setFloat32(44 + i * 4, samples[i], true);
            }
        }
        return new Blob([view], { type: 'audio/wav' });
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }
}
