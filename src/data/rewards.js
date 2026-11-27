import { star } from '../ui/draw.js';

// Car extras unlocked by finishing races (one new extra per race until all are unlocked).
// slot: one extra per slot can be worn at a time. draw() paints it on the player's car seen from
// behind: (x, y) is the bottom centre of the car and w its width (same geometry as themes/cars.js).
const geo = (w) => {
  const h = w * 0.62, fs = w * 0.62;
  return { h, bodyTop: -h * 0.82, headTop: -h * 0.82 - fs * 0.78, headCx: 0, headCy: -h * 0.82 - fs * 0.3, fs };
};

export const carExtras = [
  { id: 'stripes', name: 'Racing stripes', slot: 'paint', draw(ctx, w) {
    const g = geo(w); ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.fillRect(-w * 0.1, g.bodyTop, w * 0.06, g.h * 0.52); ctx.fillRect(w * 0.04, g.bodyTop, w * 0.06, g.h * 0.52);
  } },
  { id: 'spoiler', name: 'Spoiler wing', slot: 'top', draw(ctx, w) {
    const g = geo(w); ctx.fillStyle = '#2B2140';
    ctx.fillRect(-w * 0.36, g.bodyTop - w * 0.1, w * 0.04, w * 0.1); ctx.fillRect(w * 0.32, g.bodyTop - w * 0.1, w * 0.04, w * 0.1);
    ctx.beginPath(); ctx.roundRect(-w * 0.46, g.bodyTop - w * 0.15, w * 0.92, w * 0.07, w * 0.03); ctx.fill();
  } },
  { id: 'cap', name: 'Racing cap', slot: 'head', draw(ctx, w) {
    const g = geo(w); ctx.fillStyle = '#E63946';
    ctx.beginPath(); ctx.ellipse(0, g.headTop + g.fs * 0.2, g.fs * 0.32, g.fs * 0.18, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(-g.fs * 0.32, g.headTop + g.fs * 0.18, g.fs * 0.64, g.fs * 0.05);
    star(ctx, 0, g.headTop + g.fs * 0.1, g.fs * 0.07, '#FFD43B');
  } },
  { id: 'starDecal', name: 'Big star', slot: 'paint', draw(ctx, w) {
    const g = geo(w); star(ctx, 0, g.bodyTop + g.h * 0.2, w * 0.1, '#FFD43B', '#E59F00');
  } },
  { id: 'flag', name: 'Checkered flag', slot: 'top', draw(ctx, w) {
    const g = geo(w); const px = w * 0.4, top = g.bodyTop - w * 0.45;
    ctx.strokeStyle = '#5B5070'; ctx.lineWidth = Math.max(2, w * 0.02);
    ctx.beginPath(); ctx.moveTo(px, g.bodyTop); ctx.lineTo(px, top); ctx.stroke();
    const s = w * 0.05;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = (r + c) % 2 ? '#2B2140' : '#fff'; ctx.fillRect(px + c * s, top + r * s, s, s); }
  } },
  { id: 'sunglasses', name: 'Cool sunglasses', slot: 'face', draw(ctx, w) {
    const g = geo(w); ctx.fillStyle = '#2B2140';
    const y = g.headCy - g.fs * 0.07;
    ctx.beginPath(); ctx.roundRect(-g.fs * 0.3, y, g.fs * 0.25, g.fs * 0.13, g.fs * 0.05); ctx.fill();
    ctx.beginPath(); ctx.roundRect(g.fs * 0.05, y, g.fs * 0.25, g.fs * 0.13, g.fs * 0.05); ctx.fill();
    ctx.fillRect(-g.fs * 0.06, y + g.fs * 0.03, g.fs * 0.12, g.fs * 0.03);
  } },
  { id: 'crown', name: 'Golden crown', slot: 'head', draw(ctx, w) {
    const g = geo(w); const y = g.headTop + g.fs * 0.16, s = g.fs * 0.24;
    ctx.fillStyle = '#FFD43B'; ctx.strokeStyle = '#E59F00'; ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath(); ctx.moveTo(-s, y); ctx.lineTo(-s, y - s * 0.8); ctx.lineTo(-s * 0.5, y - s * 0.4); ctx.lineTo(0, y - s);
    ctx.lineTo(s * 0.5, y - s * 0.4); ctx.lineTo(s, y - s * 0.8); ctx.lineTo(s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  } },
  { id: 'rainbow', name: 'Rainbow paint', slot: 'paint', draw(ctx, w) {
    const g = geo(w); ['#FF6B6B', '#FFD43B', '#69DB7C', '#4DABF7', '#B983FF'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.fillRect(-w * 0.4, g.bodyTop + g.h * (0.06 + i * 0.05), w * 0.8, g.h * 0.045);
    });
  } },
];

export const getExtra = (id) => carExtras.find((x) => x.id === id);
/** The next extra the child has not unlocked yet (or null when they have them all). */
export const nextExtra = (owned = []) => carExtras.find((x) => !owned.includes(x.id)) || null;
