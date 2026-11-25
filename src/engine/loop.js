// requestAnimationFrame loop with clamped delta time; pauses when the tab is hidden.
export function createLoop(update, render) {
  let raf = 0, last = 0, running = false;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    render(dt);
    raf = requestAnimationFrame(frame);
  };
  const onVis = () => { if (document.hidden) stop(); else start(); };
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', onVis);
  return { start, stop, destroy() { stop(); document.removeEventListener('visibilitychange', onVis); } };
}
