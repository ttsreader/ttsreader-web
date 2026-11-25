/*! happy-2026-confetti.js
 *  Drop-in, self-contained production widget:
 *  - Shows confetti + “Happy 2026!!” ONLY during Jan 1–7, 2026 (local time)
 *  - Shows only once per browser via localStorage
 *  - Fully transparent overlay; never captures mouse/touch/keyboard events
 */

function showHappy2026Overlay() {
    const overlay = document.createElement("div");
    overlay.id = "ws-happy2026-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
    <div id="ws-happy2026-wrap">
      <div id="ws-happy2026-text" role="presentation"></div>
    </div>
  `;
    document.body.appendChild(overlay);

    // Build per-character spans (each char a different color)
    const msg = "Happy 2026!!";
    const colors = [
        "#FF0066", "#00B0FF", "#FFD600", "#8A2BE2", "#00E676",
        "#FF6D00", "#00E5FF", "#FF1744", "#76FF03", "#FFEA00"
    ];
    const textEl = overlay.querySelector("#ws-happy2026-text");
    textEl.innerHTML = "";
    [...msg].forEach((ch, i) => {
        const s = document.createElement("span");
        s.className = "ws-happy2026-char";
        s.textContent = ch === " " ? "\u00A0" : ch;
        s.style.setProperty("--c", colors[i % colors.length]);
        s.style.setProperty("--d", `${i * 35}ms`); // stagger
        s.style.setProperty("--r", `${(Math.random() * 18 - 9).toFixed(2)}deg`); // tiny random tilt
        textEl.appendChild(s);
    });

    // Auto-remove after a while (optional)
    setTimeout(() => overlay.remove(), 9000);
}

(function injectHappy2026Styles() {
    if (document.getElementById("ws-happy2026-style")) return;
    const style = document.createElement("style");
    style.id = "ws-happy2026-style";
    style.textContent = `
    #ws-happy2026-overlay{
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      pointer-events: none;
      background: transparent;
      display: grid;
      place-items: start center;
    }

    #ws-happy2026-wrap{
      margin-top: 10px;
      transform: translateY(-140px);
      animation: wsHappyDrop 3000ms ease-out forwards;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,.25));
      will-change: transform;
    }

    /* Big + “happy” */
    #ws-happy2026-text{
      font-family: ui-rounded, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: clamp(44px, 6vw, 92px);
      line-height: 1.05;
      padding: 14px 22px;
      border-radius: 20px;
      background: transparent;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: none;
      white-space: nowrap;
      z-index: 999;
    }

    .ws-happy2026-char{
      display: inline-block;
      color: var(--c);
      text-shadow:
        0 0 10px color-mix(in srgb, var(--c) 55%, transparent),
        0 0 22px color-mix(in srgb, var(--c) 35%, transparent),
        0 6px 18px rgba(0,0,0,.28);
      transform-origin: 50% 90%;
      transform: translateY(-18px) rotate(var(--r)) scale(0.98);
      opacity: 0;
      animation:
        wsCharIn 650ms cubic-bezier(.2,.9,.2,1) forwards,
        wsWiggle 1400ms ease-in-out infinite;
      animation-delay: var(--d), calc(var(--d) + 650ms);
      will-change: transform, opacity;
    }

    /* Softer wiggle so it feels “alive” not jittery */
    @keyframes wsWiggle {
      0%   { transform: translateY(0) rotate(var(--r)) }
      25%  { transform: translateY(-3px) rotate(calc(var(--r) * -0.6)) }
      50%  { transform: translateY(0) rotate(var(--r)) }
      75%  { transform: translateY(-2px) rotate(calc(var(--r) * 0.5)) }
      100% { transform: translateY(0) rotate(var(--r)) }
    }

    @keyframes wsCharIn {
      0%   { opacity: 0; transform: translateY(-26px) rotate(var(--r)) scale(0.96); filter: blur(2px); }
      100% { opacity: 1; transform: translateY(0) rotate(var(--r)) scale(1); filter: blur(0); }
    }

    @keyframes wsHappyDrop{
      0%   { transform: translateY(-160px); }
      10% { transform: translateY(40vh); }
      50% { transform: translateY(40vh); }
      90% { transform: translateY(40vh); }
      100% { transform: translateY(100vh); }
    }

    @media (prefers-reduced-motion: reduce){
      #ws-happy2026-wrap{ animation: none; transform: translateY(0); }
      .ws-happy2026-char{ animation: none; opacity: 1; transform: none; }
    }
  `;
    document.head.appendChild(style);
})();

(() => {
    "use strict";

    const YEAR = 2026;
    const START_MONTH_INDEX = 0; // January
    const START_DAY = 1;
    const END_DAY = 7; // inclusive (first week: Jan 1–7)

    const LS_KEY = `happy_${YEAR}_seen_v1`;

    // ---- guards ----
    const now = new Date();
    const inFirstWeek =
        now.getFullYear() === YEAR &&
        now.getMonth() === START_MONTH_INDEX &&
        now.getDate() >= START_DAY &&
        now.getDate() <= END_DAY;

    if (!inFirstWeek) return;

    const prefersReducedMotion = (() => {
        try {
            return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        } catch {
            return false;
        }
    })();

    const hasSeenAlready = (() => {
        try {
            return localStorage.getItem(LS_KEY) === "1";
        } catch {
            // If storage is blocked, we still show (best effort).
            return false;
        }
    })();

    if (hasSeenAlready) return;

    const markSeen = () => {
        try {
            localStorage.setItem(LS_KEY, "1");
        } catch {
            /* ignore */
        }
    };

    showHappy2026Overlay();

    // ---- DOM overlay (non-interactive) ----
    const overlay = document.createElement("div");
    overlay.id = "happy-2026-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:2147483647",
        "pointer-events:none", // critical: never intercept clicks/taps
        "background:transparent",
        "overflow:hidden",
        "contain:layout paint size style",
    ].join(";");

    // Canvas for confetti
    const canvas = document.createElement("canvas");
    canvas.style.cssText = [
        "position:absolute",
        "inset:0",
        "width:100%",
        "height:100%",
        "pointer-events:none",
        "background:transparent",
    ].join(";");

    overlay.appendChild(canvas);
    document.documentElement.appendChild(overlay);

    // Inject keyframes (scoped-ish via id)
    const style = document.createElement("style");
    style.textContent = `
#happy-2026-overlay * { box-sizing: border-box; }
@keyframes happy2026FadeIn {
  0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0px) scale(1); }
}
@keyframes happy2026Float {
  0%   { transform: translateY(0px); }
  100% { transform: translateY(-6px); }
}
@keyframes happy2026FadeOut {
  0%   { opacity: 1; transform: translateY(0px) scale(1); }
  100% { opacity: 0; transform: translateY(10px) scale(0.98); }
}
  `.trim();
    document.head.appendChild(style);

    // Text animation (skip motion if user prefers reduced motion)
    const SHOW_MS = prefersReducedMotion ? 1400 : 3200;
    const FADE_MS = prefersReducedMotion ? 200 : 520;

    // ---- Confetti engine ----
    const ctx = canvas.getContext("2d", { alpha: true });

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        w = Math.floor(window.innerWidth);
        h = Math.floor(window.innerHeight);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const rand = (min, max) => min + Math.random() * (max - min);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /*const palette = [
        [255, 88, 180],
        [90, 200, 255],
        [255, 220, 90],
        [180, 120, 255],
        [80, 255, 170],
    ];*/
    const palette = [
        [255, 0, 102],   // Neon pink / fuchsia  (#FF0066)
        [0, 176, 255],   // Electric blue        (#00B0FF)
        [255, 214, 0],   // Bright gold / yellow (#FFD600)
        [138, 43, 226],  // Electric purple      (#8A2BE2)
        [0, 230, 118],   // Neon green           (#00E676)
        [255, 109, 0],   // Bright orange        (#FF6D00)
    ];

    function makeConfettiPiece() {
        const [r, g, b] = palette[(Math.random() * palette.length) | 0];
        const size = rand(12, 24);
        const tilt = rand(-1, 1);
        const spin = rand(-0.18, 0.18);

        return {
            x: rand(0, w),
            y: rand(-h * 0.2, -20),
            vx: rand(-1.6, 1.6),
            vy: rand(2.4, 5.2),
            ay: rand(0.02, 0.06),
            size,
            rot: rand(0, Math.PI * 2),
            spin,
            tilt,
            wobble: rand(0, Math.PI * 2),
            wobbleSpeed: rand(0.04, 0.12),
            alpha: rand(0.78, 0.98),
            rgb: [r, g, b],
            shape: Math.random() < 0.22 ? "circle" : "rect",
        };
    }

    const pieceCount = clamp(Math.floor(w / 12), 80, 180);
    const pieces = Array.from({ length: pieceCount }, makeConfettiPiece);

    let raf = 0;
    let start = performance.now();

    function drawPiece(p) {
        const [r, g, b] = p.rgb;
        ctx.save();

        const wobbleX = Math.sin(p.wobble) * 6;
        const x = p.x + wobbleX;
        const y = p.y;

        ctx.globalAlpha = p.alpha;
        ctx.translate(x, y);
        ctx.rotate(p.rot);

        // tiny highlight for depth
        const grad = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
        grad.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`);
        grad.addColorStop(1, `rgba(255,255,255,${p.alpha * 0.45})`);
        ctx.fillStyle = grad;

        if (p.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-p.size * 0.6, -p.size * 0.25, p.size * 1.2, p.size * 0.5);
        }

        ctx.restore();
    }

    function tick(t) {
        const elapsed = t - start;

        ctx.clearRect(0, 0, w, h);

        // gentle “celebration burst” for first ~900ms: add sideways drift
        const burst = elapsed < 900 ? (1 - elapsed / 900) : 0;

        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];

            p.wobble += p.wobbleSpeed;
            p.vy += p.ay;
            p.x += p.vx + (p.vx * burst * 2.2);
            p.y += p.vy;
            p.rot += p.spin + (p.tilt * 0.02);

            // wind variation
            const wind = Math.sin((elapsed / 1000) + i) * 0.12;
            p.x += wind;

            drawPiece(p);

            // recycle when offscreen
            if (p.y > h + 40) {
                pieces[i] = makeConfettiPiece();
                pieces[i].y = rand(-120, -30);
            }
            if (p.x < -60) p.x = w + 60;
            if (p.x > w + 60) p.x = -60;
        }

        raf = requestAnimationFrame(tick);
    }

    // Start animation unless reduced motion
    if (!prefersReducedMotion) {
        raf = requestAnimationFrame(tick);
    }

    // ---- cleanup ----
    function cleanup() {
        // stop confetti shortly after fade begins
        setTimeout(() => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            style.remove();
            overlay.remove();
        }, FADE_MS + 60);
    }

    // Ensure resize doesn't break / degrade
    window.addEventListener("resize", resize, { passive: true });

    // Mark as seen immediately (so it won’t re-trigger if the user reloads mid-animation)
    markSeen();

    // Auto-hide after SHOW_MS
    setTimeout(cleanup, SHOW_MS);

    // Safety: if tab becomes hidden quickly, cleanup to reduce work
    document.addEventListener(
        "visibilitychange",
        () => {
            if (document.hidden) cleanup();
        },
        { passive: true, once: true }
    );
})();