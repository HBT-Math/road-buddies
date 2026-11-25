import { TUNING } from './world.js';
import { rrect } from '../ui/draw.js';

// Pseudo-3D renderer. Reads world state, draws with the theme. Owns no game rules.
const K = 4;                // perspective constant
const BAND = 3;             // length of one road band (world units)
const GATE_COLORS = [
  { fill: '#FF8FAB', dark: '#C9547A' },
  { fill: '#FFD166', dark: '#C99A1E' },
  { fill: '#8EC5FF', dark: '#4C8BD0' },
];

export function createRenderer(canvas, theme) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, horizon = 0, baseY = 0, lane = 0, cx = 0;
  let hit = [];               // gate tap targets for this frame
  let carScreen = { x: 0, y: 0, w: 0 };
  const P = theme.palette;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizon = H * 0.43;
    baseY = H * 0.9;
    const roadHalf = Math.min(W * 0.34, H * 0.62);
    lane = (roadHalf * 2) / 3;
    cx = W / 2;
  }
  const scale = (d) => K / (K + Math.max(d, -K * 0.7));
  const proj = (lx, d) => { const s = scale(d); return { x: cx + lx * lane * s, y: horizon + (baseY - horizon) * s, s, u: lane * s }; };

  function quad(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }

  function drawRoad(s) {
    const phase = s.offset % BAND;
    for (let k = Math.ceil(TUNING.sceneryFar / BAND) + 1; k >= 0; k--) {
      const dN = k * BAND - phase - BAND, dF = dN + BAND;
      const n = proj(0, Math.max(dN, -2.6)), f = proj(0, dF);
      if (f.y >= H) continue;
      const odd = Math.floor((dN + s.offset) / BAND + 0.5) % 2 === 0;
      ctx.fillStyle = odd ? P.grassA : P.grassB;
      ctx.fillRect(0, f.y, W, n.y - f.y + 1);
      const ex = (lx, p) => cx + lx * lane * p.s;
      // rumble strips + road
      quad(ex(-1.62, n), n.y, ex(1.62, n), n.y, ex(1.62, f), f.y, ex(-1.62, f), f.y, odd ? P.rumbleA : P.rumbleB);
      quad(ex(-1.5, n), n.y, ex(1.5, n), n.y, ex(1.5, f), f.y, ex(-1.5, f), f.y, odd ? P.road : P.roadB);
      if (odd) for (const lx of [-0.5, 0.5]) {
        quad(ex(lx - 0.035, n), n.y, ex(lx + 0.035, n), n.y, ex(lx + 0.035, f), f.y, ex(lx - 0.035, f), f.y, P.lane);
      }
    }
  }

  function drawGate(g, s, t, holding) {
    hit = [];
    const p = proj(0, g.d);
    if (p.y > H * 1.6) return;
    const u = p.u, gh = u * 1.45;
    for (let i = 0; i < 3; i++) {
      const lx = i - 1;
      const c = GATE_COLORS[i];
      const res = g.result;
      const chosen = (holding || (s.phase === 'pass' && !res)) && s.lane === lx;
      const isHit = res && res.lane === lx;
      const pulse = chosen ? 1 + 0.05 * Math.sin(t * 5) : 1; // ~0.8 Hz, far below 3 flashes/s
      const x = cx + lx * lane * p.s, y = p.y;
      const l = x - u * 0.47, r = x + u * 0.47;
      // posts
      ctx.fillStyle = c.dark;
      rrect(ctx, l - u * 0.05, y - gh, u * 0.1, gh, u * 0.03); ctx.fill();
      rrect(ctx, r - u * 0.05, y - gh, u * 0.1, gh, u * 0.03); ctx.fill();
      // banner
      ctx.fillStyle = isHit && res.correct ? '#FFE066' : c.fill;
      ctx.strokeStyle = c.dark; ctx.lineWidth = Math.max(1.5, u * 0.03);
      rrect(ctx, l - u * 0.06, y - gh - u * 0.12, r - l + u * 0.12, u * 0.24, u * 0.08); ctx.fill(); ctx.stroke();
      // number disc
      const dy = y - gh * 0.6;
      const rad = u * 0.34 * pulse * (isHit && !res.correct ? 0.92 : 1);
      if (chosen) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(x, dy, rad * 1.28, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = chosen ? '#2B2140' : c.dark;
      ctx.lineWidth = Math.max(2, u * (chosen ? 0.075 : 0.05));
      ctx.beginPath(); ctx.arc(x, dy, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2B2140';
      ctx.font = `800 ${Math.round(rad * 1.25)}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(g.values[i]), x, dy + rad * 0.06);
      // "you are here" chevron on the road (shape, not only colour)
      if (chosen && holding) {
        const cy2 = y + u * 0.12;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.moveTo(x - u * 0.16, cy2 + u * 0.12); ctx.lineTo(x, cy2); ctx.lineTo(x + u * 0.16, cy2 + u * 0.12); ctx.lineTo(x, cy2 + u * 0.06); ctx.closePath(); ctx.fill();
      }
      hit.push({ lane: lx, x0: l - u * 0.1, x1: r + u * 0.1, y0: y - gh - u * 0.2, y1: y + u * 0.2, cx: x, cy: dy, r: rad });
    }
  }

  function drawFinish(d, t) {
    const l = proj(-1.62, d), r = proj(1.62, d);
    const u = l.u, top = l.y - u * 1.9, hgt = u * 0.42;
    if (l.y > H * 1.8 || d < -3) return;
    ctx.fillStyle = '#5B5070';
    rrect(ctx, l.x - u * 0.08, top, u * 0.16, l.y - top, u * 0.05); ctx.fill();
    rrect(ctx, r.x - u * 0.08, top, u * 0.16, l.y - top, u * 0.05); ctx.fill();
    // checkered banner (pattern + shape, not colour alone)
    const cols = 16, cw = (r.x - l.x) / cols;
    for (let row = 0; row < 2; row++) for (let i = 0; i < cols; i++) {
      ctx.fillStyle = (i + row) % 2 ? '#2B2140' : '#FFFFFF';
      ctx.fillRect(l.x + i * cw, top + row * (hgt / 2), cw + 0.5, hgt / 2 + 0.5);
    }
    ctx.strokeStyle = '#2B2140'; ctx.lineWidth = Math.max(2, u * 0.03);
    ctx.strokeRect(l.x, top, r.x - l.x, hgt);
    // balloons
    ['#FF8FAB', '#FFD166', '#8EC5FF', '#9BE59B'].forEach((c, i) => {
      const bx = i < 2 ? l.x - u * (0.25 + i * 0.3) : r.x + u * (0.25 + (i - 2) * 0.3);
      const by = top - u * 0.2 + Math.sin(t * 2 + i) * u * 0.05;
      ctx.strokeStyle = '#5B5070'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx, by + u * 0.2); ctx.lineTo(i < 2 ? l.x : r.x, top + hgt); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bx, by, u * 0.15, u * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawFriend(img, x, y, u, bob) {
    if (!img) return;
    const hgt = u * 1.25, wid = (hgt * 120) / 190;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x, y, wid * 0.4, u * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, x - wid / 2, y - hgt - bob, wid, hgt);
  }

  return {
    resize,
    get size() { return { W, H }; },
    get car() { return carScreen; },
    hitTest(x, y) { return hit.find((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)?.lane ?? null; },
    gateDisc(laneX) { return hit.find((b) => b.lane === laneX) || null; },

    draw(s, { faceImg, accent, accentDark, friendImgs, reduced, effects }) {
      const t = s.t;
      ctx.clearRect(0, 0, W, H);
      theme.background.sky(ctx, W, horizon, t, reduced, P);
      theme.background.hills(ctx, W, horizon, -s.carX * 40);
      drawRoad(s);

      // collect sprites and draw far -> near
      const sprites = [];
      for (const sc of s.scenery) sprites.push({ d: sc.d, draw: () => {
        const p = proj(sc.x, sc.d);
        if (p.y < horizon - 2 || p.x < -p.u * 2 || p.x > W + p.u * 2) return;
        theme.scenery.find((k) => k.type === sc.kind)?.draw(ctx, p.x, p.y, p.u);
      } });
      const g = s.gate;
      if (g) {
        const holding = s.phase === 'hold';
        sprites.push({ d: g.d, draw: () => drawGate(g, s, t, holding) });
        if (friendImgs?.length) {
          friendImgs.forEach((imgs, i) => {
            const side = i === 0 ? -1 : 1;
            const fd = g.d + 0.4;
            sprites.push({ d: fd, draw: () => {
              const p = proj(side * 2.35, fd);
              const mood = s.friendsMood;
              const wavePose = Math.floor(t * 2.2 + i) % 2 ? 'wave' : 'idle';
              const pose = mood === 'cheer' ? 'cheer' : mood === 'idle' ? 'idle' : wavePose;
              const bob = mood === 'cheer' && !reduced ? Math.abs(Math.sin(t * 7 + i)) * p.u * 0.25 : 0;
              drawFriend(imgs[pose], p.x, p.y, p.u, bob);
            } });
          });
        }
      } else hit = [];
      if (s.finishD !== null && s.finishD !== undefined) sprites.push({ d: s.finishD, draw: () => drawFinish(s.finishD, t) });
      // the player's car
      sprites.push({ d: 0.01, draw: () => {
        const p = proj(s.carX, 0);
        const w = lane * 0.9;
        const tilt = Math.max(-0.12, Math.min(0.12, (s.lane - s.carX) * 0.25));
        const bob = s.speed > 0.5 && !reduced ? Math.sin(t * 18) * 1.2 : 0;
        carScreen = { x: p.x, y: p.y, w };
        theme.vehicle(ctx, { x: p.x, y: p.y, w, accent, accentDark, faceImg, tilt, bob });
      } });
      sprites.sort((a, b) => b.d - a.d).forEach((sp) => sp.draw());
      effects?.draw(ctx);
    },
  };
}
