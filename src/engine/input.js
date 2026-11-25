// All steering inputs funnel into three intents: steer(-1|1), go(), tap(x, y).
// Supports: tap left/right half, drag, swipe, arrow keys / A-D, Up / W / Space / Enter.
export function createInput(surface, { steer, go, tap }) {
  let down = null;
  const DRAG_STEP = 56;

  const onDown = (e) => {
    if (e.button > 0) return;
    down = { x: e.clientX, y: e.clientY, ax: e.clientX, moved: false, id: e.pointerId, t: performance.now() };
    surface.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.ax;
    if (Math.abs(dx) >= DRAG_STEP) {
      steer(Math.sign(dx));
      down.ax = e.clientX;
      down.moved = true;
    }
  };
  const onUp = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    const dtm = performance.now() - down.t;
    if (!down.moved) {
      if (Math.abs(dx) > 24 && dtm < 400) steer(Math.sign(dx));        // quick swipe
      else if (dy < -60 && Math.abs(dx) < 40) go();                      // swipe up = drive through
      else if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
        const r = surface.getBoundingClientRect();
        tap(e.clientX - r.left, e.clientY - r.top);
      }
    }
    down = null;
  };
  const onKey = (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { steer(-1); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { steer(1); e.preventDefault(); }
    else if (k === 'arrowup' || k === 'w' || (k === ' ' && e.target === document.body) || (k === 'enter' && e.target === document.body)) { go(); e.preventDefault(); }
  };

  surface.addEventListener('pointerdown', onDown);
  surface.addEventListener('pointermove', onMove);
  surface.addEventListener('pointerup', onUp);
  surface.addEventListener('pointercancel', () => { down = null; });
  window.addEventListener('keydown', onKey);
  return {
    destroy() {
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
    },
  };
}
