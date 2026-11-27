// Theme 1: Cars on a sunny road.
// A theme only supplies looks and sounds. Gameplay, levels and the ten frame never read it.
// Contract: { id, nameKey, icon, palette, background:{sky, hills}, scenery[], vehicle(), reward{draw, icon}, sounds{}, music{} }

import { star, rrect } from '../../ui/draw.js';

export const carsTheme = {
  id: 'cars',
  nameKey: 'theme.cars',
  icon: `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="0" y="0" width="120" height="90" rx="18" fill="#BDE6FF"/>
    <circle cx="96" cy="22" r="11" fill="#FFD43B"/><path d="M0 64 Q30 48 60 60 T120 56 V90 H0Z" fill="#7BC96F"/>
    <path d="M42 90 L54 52 H66 L78 90Z" fill="#6B7280"/><path d="M60 58 V66 M60 72 V82" stroke="#fff" stroke-width="3"/>
    <rect x="34" y="52" width="52" height="22" rx="9" fill="#E63946" stroke="#A4222D" stroke-width="3"/>
    <circle cx="44" cy="76" r="7" fill="#2B2140"/><circle cx="76" cy="76" r="7" fill="#2B2140"/></svg>`,

  palette: {
    skyTop: '#7CC8FF', skyBottom: '#D8F1FF',
    grassA: '#86D16F', grassB: '#78C463',
    road: '#7C8492', roadB: '#747C8A',
    rumbleA: '#FFFFFF', rumbleB: '#F25C54',
    lane: '#FFFFFF',
  },

  background: {
    sky(ctx, w, horizon, t, reduced, p) {
      const g = ctx.createLinearGradient(0, 0, 0, horizon);
      g.addColorStop(0, p.skyTop); g.addColorStop(1, p.skyBottom);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, horizon + 2);
      // sun
      const sx = w * 0.84, sy = horizon * 0.32, sr = Math.min(w, horizon) * 0.11;
      ctx.fillStyle = 'rgba(255,224,102,0.35)';
      ctx.beginPath(); ctx.arc(sx, sy, sr * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFD43B'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      // clouds drift slowly (never flashes)
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      const drift = reduced ? 0 : t * 6;
      [[0.12, 0.3, 1], [0.45, 0.18, 0.8], [0.68, 0.42, 0.65]].forEach(([fx, fy, sc], i) => {
        const cw = w * 0.13 * sc;
        const x = ((fx * w + drift * (1 + i * 0.3)) % (w + cw * 2)) - cw;
        const y = horizon * fy;
        ctx.beginPath();
        ctx.ellipse(x, y, cw * 0.5, cw * 0.22, 0, 0, Math.PI * 2);
        ctx.ellipse(x - cw * 0.25, y + cw * 0.04, cw * 0.28, cw * 0.18, 0, 0, Math.PI * 2);
        ctx.ellipse(x + cw * 0.12, y - cw * 0.1, cw * 0.26, cw * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    hills(ctx, w, horizon, shift, p = {}) {
      const layer = (color, amp, freq, phase, base) => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, horizon + 1);
        for (let x = 0; x <= w; x += 8) {
          const y = horizon - base - amp * (0.5 + 0.5 * Math.sin((x + shift * phase) * freq + phase));
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, horizon + 1); ctx.closePath(); ctx.fill();
      };
      layer(p.hillA || '#A8DCA0', horizon * 0.12, 0.006, 1.3, horizon * 0.02);
      layer(p.hillB || '#93D08A', horizon * 0.07, 0.011, 2.1, 0);
    },
  },

  // Roadside decorations. size is the pixel size of one world unit at that distance.
  scenery: [
    { type: 'tree', weight: 3, draw(ctx, x, y, u) {
      ctx.fillStyle = '#8B5E3C'; ctx.fillRect(x - u * 0.09, y - u * 0.7, u * 0.18, u * 0.7);
      ctx.fillStyle = '#4FAE5A';
      [[0, -1.05, 0.5], [-0.3, -0.8, 0.36], [0.3, -0.8, 0.36]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * u, y + dy * u, r * u, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(x - u * 0.12, y - u * 1.2, u * 0.16, 0, Math.PI * 2); ctx.fill();
    } },
    { type: 'bush', weight: 2, draw(ctx, x, y, u) {
      ctx.fillStyle = '#5DBB63';
      [[-0.25, 0.22], [0.2, 0.25], [0, 0.3]].forEach(([dx, r]) => {
        ctx.beginPath(); ctx.arc(x + dx * u, y - r * u * 0.8, r * u, 0, Math.PI * 2); ctx.fill();
      });
    } },
    { type: 'flowers', weight: 2, draw(ctx, x, y, u) {
      const cols = ['#FF6B9A', '#FFD43B', '#FFFFFF', '#B983FF'];
      for (let i = 0; i < 4; i++) {
        const fx = x + (i - 1.5) * u * 0.16, fy = y - u * (0.12 + (i % 2) * 0.08);
        ctx.strokeStyle = '#3E8E45'; ctx.lineWidth = Math.max(1, u * 0.025);
        ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(fx, fy, u * 0.06, 0, Math.PI * 2); ctx.fill();
      }
    } },
    { type: 'house', weight: 1, far: true, draw(ctx, x, y, u) {
      const w = u * 1.1, h = u * 0.8;
      ctx.fillStyle = '#FFF3D6'; ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#E86A5A'; ctx.beginPath();
      ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h - u * 0.55); ctx.lineTo(x + w * 0.62, y - h); ctx.fill();
      ctx.fillStyle = '#7CC8FF'; ctx.fillRect(x - w * 0.32, y - h * 0.72, w * 0.2, w * 0.2);
      ctx.fillStyle = '#A0673F'; ctx.fillRect(x + w * 0.08, y - h * 0.55, w * 0.22, h * 0.55);
    } },
  ],

  /** Draws the player's vehicle, seen from behind. (x, y) = bottom centre, w = width in px. */
  vehicle(ctx, { x, y, w, accent, accentDark, faceImg, tilt = 0, bob = 0 }) {
    const h = w * 0.62;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(tilt);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    // wheels
    ctx.fillStyle = '#2B2140';
    rrect(ctx, -w * 0.5, -h * 0.42, w * 0.2, h * 0.44, w * 0.05); ctx.fill();
    rrect(ctx, w * 0.3, -h * 0.42, w * 0.2, h * 0.44, w * 0.05); ctx.fill();
    // seat back + buddy riding in the convertible
    ctx.fillStyle = accentDark;
    rrect(ctx, -w * 0.3, -h * 1.05, w * 0.6, h * 0.4, w * 0.08); ctx.fill();
    if (faceImg) {
      const fs = w * 0.62;
      ctx.drawImage(faceImg, -fs / 2, -h * 0.82 - fs * 0.78, fs, fs);
    }
    // body
    ctx.fillStyle = accent; ctx.strokeStyle = accentDark; ctx.lineWidth = Math.max(2, w * 0.025);
    rrect(ctx, -w * 0.47, -h * 0.82, w * 0.94, h * 0.62, w * 0.12); ctx.fill(); ctx.stroke();
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    rrect(ctx, -w * 0.38, -h * 0.76, w * 0.5, h * 0.09, h * 0.05); ctx.fill();
    // tail lights
    ctx.fillStyle = '#FFE066'; ctx.strokeStyle = accentDark; ctx.lineWidth = Math.max(1, w * 0.012);
    rrect(ctx, -w * 0.42, -h * 0.62, w * 0.16, h * 0.14, h * 0.05); ctx.fill(); ctx.stroke();
    rrect(ctx, w * 0.26, -h * 0.62, w * 0.16, h * 0.14, h * 0.05); ctx.fill(); ctx.stroke();
    // bumper + plate with a star
    ctx.fillStyle = '#E9ECF2';
    rrect(ctx, -w * 0.48, -h * 0.3, w * 0.96, h * 0.14, h * 0.06); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#B8BECC'; ctx.lineWidth = Math.max(1, w * 0.01);
    rrect(ctx, -w * 0.13, -h * 0.5, w * 0.26, h * 0.17, h * 0.04); ctx.fill(); ctx.stroke();
    star(ctx, 0, -h * 0.415, h * 0.07, '#FFC93C');
    ctx.restore();
  },

  reward: {
    draw(ctx, x, y, size, spin = 0) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
      star(ctx, 0, 0, size, '#FFD43B', '#E59F00');
      ctx.restore();
    },
    icon: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L24.9 14.2 L37 15.3 L27.8 23.3 L30.6 35.2 L20 28.9 L9.4 35.2 L12.2 23.3 L3 15.3 L15.1 14.2Z" fill="#FFD43B" stroke="#E59F00" stroke-width="3" stroke-linejoin="round"/></svg>`,
  },

  sounds: { correct: 'correct', oops: 'oops', collect: 'collect', lane: 'lane', go: 'whoosh', streak: 'streak', done: 'fanfare' },
  // Short cheerful loop, generated live (audio/music.js). One bar per chord, 8 eighth-note steps per bar.
  music: {
    tempo: 108,
    chords: [['C3', 'E4', 'G4'], ['A2', 'C4', 'E4'], ['F2', 'A3', 'C4'], ['G2', 'B3', 'D4']],
    melody: 'E5 - G5 - A5 G5 E5 - | C5 - E5 - D5 C5 A4 - | A4 - C5 - D5 - C5 A4 | G4 - B4 - D5 - - -',
  },
};

