import { star } from '../ui/draw.js';

// Screen-space effects. Gentle by design: no strobing, everything fades over ~1s.
export function createParticles() {
  let list = [];
  let reduced = false;
  const rnd = (a, b) => a + Math.random() * (b - a);

  return {
    setReduced(v) { reduced = v; },
    clear() { list = []; },
    sparkles(x, y, size, n = 18) {
      const cols = ['#FFD43B', '#FF8FAB', '#8EC5FF', '#9BE59B', '#FFFFFF'];
      const count = reduced ? Math.ceil(n / 3) : n;
      for (let i = 0; i < count; i++) {
        const a = rnd(0, Math.PI * 2), sp = reduced ? 0 : rnd(size * 2, size * 6);
        list.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - size * 2, life: 0, max: rnd(0.7, 1.1), r: rnd(size * 0.12, size * 0.28), c: cols[i % cols.length], spin: rnd(-4, 4) });
      }
    },
    puffs(x, y, size) {
      const count = reduced ? 3 : 8;
      for (let i = 0; i < count; i++) {
        const a = rnd(-Math.PI, 0);
        list.push({ kind: 'puff', x, y, vx: Math.cos(a) * size * 1.2, vy: Math.sin(a) * size * 1.2, life: 0, max: rnd(0.6, 0.9), r: rnd(size * 0.15, size * 0.3) });
      }
    },
    /** A reward flies from (x,y) to (tx,ty), then onArrive() runs. */
    fly(x, y, tx, ty, size, draw, onArrive) {
      list.push({ kind: 'fly', x0: x, y0: y, x, y, tx, ty, life: 0, max: reduced ? 0.35 : 0.85, r: size, draw, onArrive, spin: 0 });
    },
    update(dt) {
      for (const p of list) {
        p.life += dt;
        if (p.kind === 'fly') {
          const k = Math.min(1, p.life / p.max), e = k * k * (3 - 2 * k);
          p.x = p.x0 + (p.tx - p.x0) * e;
          p.y = p.y0 + (p.ty - p.y0) * e - Math.sin(k * Math.PI) * 80;
          p.spin += dt * 4;
          if (k >= 1 && p.onArrive) { p.onArrive(); p.onArrive = null; }
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.kind === 'spark') { p.vy += 900 * dt * 0.5; p.vx *= 0.98; }
          else { p.r *= 1 + dt * 0.8; }
        }
      }
      list = list.filter((p) => p.life < p.max);
    },
    draw(ctx) {
      for (const p of list) {
        const fade = 1 - p.life / p.max;
        ctx.globalAlpha = p.kind === 'fly' ? 1 : Math.max(0, fade);
        if (p.kind === 'spark') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin * p.life);
          star(ctx, 0, 0, p.r, p.c); ctx.restore();
        } else if (p.kind === 'puff') {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        } else if (p.kind === 'fly') {
          p.draw(ctx, p.x, p.y, p.r, p.spin);
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
