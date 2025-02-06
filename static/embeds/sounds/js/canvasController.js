// js/canvasController.js
export class BaseCanvasController {
    constructor(canvas, segments, canvasWidth, canvasHeight) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.segments = segments;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.points = new Array(segments).fill(0);
        this.draggingIndex = -1;
        this.dragRadius = 10;

        this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.canvas.addEventListener("mouseup", () => this.onMouseUp());
        this.canvas.addEventListener("mouseleave", () => this.onMouseUp());
    }

    getNearestIndex(x) {
        const segWidth = this.canvasWidth / this.segments;
        let index = Math.floor(x / segWidth);
        if (index < 0) index = 0;
        if (index >= this.segments) index = this.segments - 1;
        return index;
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const idx = this.getNearestIndex(x);
        const pointX = ((idx + 0.5) * this.canvasWidth) / this.segments;
        const pointY = this.valueToY(this.points[idx]);
        if (Math.hypot(x - pointX, y - pointY) <= this.dragRadius + 4) {
            this.draggingIndex = idx;
        }
    }

    onMouseMove(e) {
        if (this.draggingIndex !== -1) {
            const rect = this.canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const clampedY = Math.min(Math.max(y, 0), this.canvasHeight);
            this.points[this.draggingIndex] = this.yToValue(clampedY);
            this.draw();
        }
    }

    onMouseUp() {
        this.draggingIndex = -1;
    }

    // Subclasses must implement these methods:
    valueToY(value) { throw new Error("Not implemented"); }
    yToValue(y) { throw new Error("Not implemented"); }
    drawGrid() { throw new Error("Not implemented"); }

    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawGrid();
        // Draw vertical grid lines for segments
        this.ctx.strokeStyle = "#ddd";
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.segments; i++) {
            const x = (i * this.canvasWidth) / this.segments;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }
        // Draw connecting line
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.lineColor;
        for (let i = 0; i < this.segments; i++) {
            const x = ((i + 0.5) * this.canvasWidth) / this.segments;
            const y = this.valueToY(this.points[i]);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        // Draw control points and labels
        for (let i = 0; i < this.segments; i++) {
            const x = ((i + 0.5) * this.canvasWidth) / this.segments;
            const y = this.valueToY(this.points[i]);
            this.ctx.fillStyle = "#000";
            this.ctx.font = "12px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.getDisplayValue(this.points[i]), x, y - 10);
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.pointColor;
            this.ctx.fill();
            this.ctx.strokeStyle = "#fff";
            this.ctx.stroke();
        }
    }

    getDisplayValue(value) {
        return value;
    }
}

export class FrequencyController extends BaseCanvasController {
    constructor(canvas, segments, canvasWidth, canvasHeight, minFreq, maxFreq) {
        super(canvas, segments, canvasWidth, canvasHeight);
        this.minFreq = minFreq;
        this.maxFreq = maxFreq;
        this.points = new Array(segments).fill(1000); // default value
        this.pointColor = "#007BFF";
        this.lineColor = "#007BFF";
    }

    // Logarithmic mapping
    valueToY(freq) {
        const logMin = Math.log(this.minFreq);
        const logMax = Math.log(this.maxFreq);
        return ((logMax - Math.log(freq)) / (logMax - logMin)) * this.canvasHeight;
    }

    yToValue(y) {
        const logMin = Math.log(this.minFreq);
        const logMax = Math.log(this.maxFreq);
        const logFreq = logMax - (y / this.canvasHeight) * (logMax - logMin);
        return Math.exp(logFreq);
    }

    drawGrid() {
        const freqGridValues = [this.minFreq, 200, 500, 1000, 2000, this.maxFreq];
        this.ctx.strokeStyle = "#eee";
        this.ctx.lineWidth = 1;
        this.ctx.font = "10px Arial";
        this.ctx.textAlign = "left";
        freqGridValues.forEach(val => {
            if (val >= this.minFreq && val <= this.maxFreq) {
                const y = this.valueToY(val);
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvasWidth, y);
                this.ctx.stroke();
                this.ctx.fillStyle = "#000";
                this.ctx.fillText(val + " Hz", 5, y - 2);
            }
        });
    }

    getDisplayValue(value) {
        return Math.round(value) + " Hz";
    }
}

export class VolumeController extends BaseCanvasController {
    constructor(canvas, segments, canvasWidth, canvasHeight) {
        super(canvas, segments, canvasWidth, canvasHeight);
        this.points = new Array(segments).fill(1); // full volume by default
        this.pointColor = "#28a745";
        this.lineColor = "#28a745";
    }

    // Linear mapping from 0 to 1.
    valueToY(vol) {
        return (1 - vol) * this.canvasHeight;
    }

    yToValue(y) {
        let vol = 1 - (y / this.canvasHeight);
        return Math.min(Math.max(vol, 0), 1);
    }

    drawGrid() {
        const volGridValues = [0, 0.25, 0.5, 0.75, 1];
        this.ctx.strokeStyle = "#eee";
        this.ctx.lineWidth = 1;
        this.ctx.font = "10px Arial";
        this.ctx.textAlign = "left";
        volGridValues.forEach(val => {
            const y = this.valueToY(val);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
            this.ctx.fillStyle = "#000";
            this.ctx.fillText(val.toFixed(2), 5, y - 2);
        });
    }

    getDisplayValue(value) {
        return value.toFixed(2);
    }
}
