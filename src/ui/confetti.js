// One-shot confetti over a screen. Gentle: pieces drift and fade, no flashing.
// In reduced-motion mode a handful of pieces simply appear and fade in place.
export function confetti(parent, { reduced = false, count = 90 } = {}) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  c.setAttribute('aria-hidden', 'true');
  parent.append(c);
  const ctx = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (c.width = parent.clientWidth * dpr), H = (c.height = parent.clientHeight * dpr);
  const cols = ['#FF8FAB', '#FFD166', '#8EC5FF', '#9BE59B', '#B983FF', '#F3722C'];
  const n = reduced ? 20 : count;
  const parts = Array.from({ length: n }, (_, i) => ({
    x: Math.random() * W, y: reduced ? Math.random() * H * 0.6 : -Math.random() * H * 0.5,
    vx: (Math.random() - 0.5) * 60 * dpr, vy: (80 + Math.random() * 120) * dpr,
    s: (6 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
    c: cols[i % cols.length], shape: i % 3,
  }));
  let last = performance.now(), age = 0, raf = 0;
  const life = reduced ? 1.5 : 3.5;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; age += dt;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, Math.min(1, (life - age) / 0.8));
    for (const p of parts) {
      if (!reduced) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.shape === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(0, -p.s / 2); ctx.lineTo(p.s / 2, p.s / 2); ctx.lineTo(-p.s / 2, p.s / 2); ctx.fill(); }
      ctx.restore();
    }
    if (age < life) raf = requestAnimationFrame(frame); else c.remove();
  };
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); c.remove(); };
}
