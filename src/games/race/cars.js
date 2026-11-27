// Drawings of the talking rival cars. Original designs: big eyes on the window, a mouth on the bumper.
// Shape table: width / height factors and roof style per car shape.
const SHAPES = {
  zippy:   { w: 0.8,  h: 0.56, r: 0.45, roof: 'round' },
  sports:  { w: 0.95, h: 0.44, r: 0.3,  roof: 'wing' },
  truck:   { w: 1.05, h: 0.84, r: 0.12, roof: 'box' },
  bug:     { w: 0.74, h: 0.6,  r: 0.5,  roof: 'dome' },
  classic: { w: 0.9,  h: 0.74, r: 0.22, roof: 'flag' },
  racer:   { w: 1.0,  h: 0.42, r: 0.3,  roof: 'fin' },
};
export const shapeOf = (racer) => SHAPES[racer.shape] || SHAPES.zippy;

/** Rival seen from behind, on the road canvas. (x, y) = bottom centre, w = lane-based width. */
export function drawRivalRear(ctx, racer, x, y, w, t = 0, mood = 'happy') {
  const S = shapeOf(racer);
  const bw = w * S.w, bh = w * S.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(0, 0, bw * 0.55, bh * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  // wheels
  ctx.fillStyle = '#2B2140';
  ctx.beginPath(); ctx.roundRect(-bw * 0.5, -bh * 0.32, bw * 0.2, bh * 0.34, bw * 0.05); ctx.fill();
  ctx.beginPath(); ctx.roundRect(bw * 0.3, -bh * 0.32, bw * 0.2, bh * 0.34, bw * 0.05); ctx.fill();
  // roof extras behind the body
  ctx.fillStyle = racer.dark;
  if (S.roof === 'wing') { ctx.fillRect(-bw * 0.44, -bh * 1.32, bw * 0.88, bh * 0.12); ctx.fillRect(-bw * 0.3, -bh * 1.22, bw * 0.05, bh * 0.25); ctx.fillRect(bw * 0.25, -bh * 1.22, bw * 0.05, bh * 0.25); }
  if (S.roof === 'fin') { ctx.beginPath(); ctx.moveTo(-bw * 0.05, -bh * 0.95); ctx.lineTo(0, -bh * 1.6); ctx.lineTo(bw * 0.05, -bh * 0.95); ctx.fill(); }
  if (S.roof === 'flag') {
    ctx.strokeStyle = '#5B5070'; ctx.lineWidth = Math.max(1.5, w * 0.02);
    ctx.beginPath(); ctx.moveTo(bw * 0.38, -bh * 0.95); ctx.lineTo(bw * 0.38, -bh * 1.55); ctx.stroke();
    ctx.fillStyle = '#E63946'; ctx.beginPath(); ctx.moveTo(bw * 0.38, -bh * 1.55); ctx.lineTo(bw * 0.38 + w * 0.16, -bh * 1.47 + Math.sin(t * 6) * w * 0.02); ctx.lineTo(bw * 0.38, -bh * 1.38); ctx.fill();
  }
  // body
  ctx.fillStyle = racer.color; ctx.strokeStyle = racer.dark; ctx.lineWidth = Math.max(1.5, w * 0.025);
  ctx.beginPath();
  if (S.roof === 'dome') { ctx.ellipse(0, -bh * 0.55, bw * 0.5, bh * 0.55, 0, Math.PI, 0); ctx.lineTo(bw * 0.5, -bh * 0.2); ctx.lineTo(-bw * 0.5, -bh * 0.2); ctx.closePath(); }
  else ctx.roundRect(-bw * 0.5, -bh, bw, bh * 0.8, bh * S.r);
  ctx.fill(); ctx.stroke();
  // rear window with eyes looking back at you
  const wy = -bh * (S.roof === 'dome' ? 0.82 : 0.9), ww = bw * 0.62, wh = bh * 0.38;
  ctx.fillStyle = '#DFF3FF'; ctx.strokeStyle = racer.dark;
  ctx.beginPath(); ctx.roundRect(-ww / 2, wy, ww, wh, wh * 0.4); ctx.fill(); ctx.stroke();
  const blink = Math.sin(t * 1.3 + racer.id.length) > 0.985;
  const er = Math.min(ww * 0.17, wh * 0.42);
  for (const sx of [-1, 1]) {
    const ex = sx * ww * 0.22, ey = wy + wh * 0.5;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, er, blink ? er * 0.15 : er, 0, 0, Math.PI * 2); ctx.fill();
    if (!blink) { ctx.fillStyle = racer.eyes; ctx.beginPath(); ctx.arc(ex, ey + er * 0.2, er * 0.5, 0, Math.PI * 2); ctx.fill(); }
  }
  // tail lights + bumper mouth
  ctx.fillStyle = '#FFE066';
  ctx.beginPath(); ctx.roundRect(-bw * 0.46, -bh * 0.48, bw * 0.14, bh * 0.12, bh * 0.04); ctx.fill();
  ctx.beginPath(); ctx.roundRect(bw * 0.32, -bh * 0.48, bw * 0.14, bh * 0.12, bh * 0.04); ctx.fill();
  ctx.strokeStyle = '#2B2140'; ctx.lineWidth = Math.max(1.5, w * 0.025); ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'wow') { ctx.fillStyle = '#2B2140'; ctx.ellipse(0, -bh * 0.36, bw * 0.06, bh * 0.07, 0, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.moveTo(-bw * 0.12, -bh * 0.4); ctx.quadraticCurveTo(0, -bh * 0.28, bw * 0.12, -bh * 0.4); ctx.stroke(); }
  ctx.restore();
}

/** Front-view portrait (SVG) for speech bubbles, the cup screen and results. */
export function racerSvg(racer, size = 120) {
  const S = shapeOf(racer);
  const bw = 100 * Math.min(1, S.w), bh = 70 * S.h + 18;
  const x0 = 60 - bw / 2, y1 = 96, y0 = y1 - bh;
  const roof = {
    wing: `<rect x="${x0 + 6}" y="${y0 - 14}" width="${bw - 12}" height="7" rx="3" fill="${racer.dark}"/>`,
    fin: `<path d="M57 ${y0} L60 ${y0 - 26} L63 ${y0}Z" fill="${racer.dark}"/>`,
    flag: `<path d="M${x0 + bw - 12} ${y0} V${y0 - 28}" stroke="#5B5070" stroke-width="3"/><path d="M${x0 + bw - 12} ${y0 - 28} L${x0 + bw + 4} ${y0 - 22} L${x0 + bw - 12} ${y0 - 16}Z" fill="#E63946"/>`,
  }[S.roof] || '';
  const body = S.roof === 'dome'
    ? `<path d="M${x0} ${y1 - 14} V${y0 + bh * 0.5} A${bw / 2} ${bh * 0.55} 0 0 1 ${x0 + bw} ${y0 + bh * 0.5} V${y1 - 14} Q${x0 + bw} ${y1} ${x0 + bw - 12} ${y1} H${x0 + 12} Q${x0} ${y1} ${x0} ${y1 - 14}Z"`
    : `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="${Math.min(bh, bw) * S.r}"`;
  const wy = y0 + bh * 0.12, wh = bh * 0.4, ww = bw * 0.7;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    ${roof}
    <rect x="${x0 + 4}" y="${y1 - 8}" width="18" height="20" rx="5" fill="#2B2140"/><rect x="${x0 + bw - 22}" y="${y1 - 8}" width="18" height="20" rx="5" fill="#2B2140"/>
    ${body} fill="${racer.color}" stroke="${racer.dark}" stroke-width="3.5"/>
    <rect x="${60 - ww / 2}" y="${wy}" width="${ww}" height="${wh}" rx="${wh * 0.45}" fill="#DFF3FF" stroke="${racer.dark}" stroke-width="2.5"/>
    <ellipse cx="${60 - ww * 0.22}" cy="${wy + wh * 0.52}" rx="${wh * 0.36}" ry="${wh * 0.4}" fill="#fff"/><ellipse cx="${60 + ww * 0.22}" cy="${wy + wh * 0.52}" rx="${wh * 0.36}" ry="${wh * 0.4}" fill="#fff"/>
    <circle cx="${60 - ww * 0.2}" cy="${wy + wh * 0.58}" r="${wh * 0.2}" fill="${racer.eyes}"/><circle cx="${60 + ww * 0.24}" cy="${wy + wh * 0.58}" r="${wh * 0.2}" fill="${racer.eyes}"/>
    <circle cx="${60 - ww * 0.17}" cy="${wy + wh * 0.5}" r="${wh * 0.07}" fill="#fff"/><circle cx="${60 + ww * 0.27}" cy="${wy + wh * 0.5}" r="${wh * 0.07}" fill="#fff"/>
    <circle cx="${x0 + 12}" cy="${y1 - 16}" r="6" fill="#FFF3B0" stroke="${racer.dark}" stroke-width="2"/><circle cx="${x0 + bw - 12}" cy="${y1 - 16}" r="6" fill="#FFF3B0" stroke="${racer.dark}" stroke-width="2"/>
    <path d="M48 ${y1 - 15} Q60 ${y1 - 4} 72 ${y1 - 15}" fill="#fff" stroke="#2B2140" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
