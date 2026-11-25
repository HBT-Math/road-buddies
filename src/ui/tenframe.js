// Reusable ten frame. Renders 1 or 2 frames (Pack 2 uses 2). Theme-independent.
//
//   const tf = createTenFrame({ frames: 1, mode: 'shown', onStep });
//   parent.append(tf.el);
//   tf.showQuestion(q, { labels });      // static picture of the question
//   await tf.animateSolution(q);          // counters slide in / out, then counted
//   tf.setMode('tap-to-reveal');
//
// Modes: 'hidden' | 'shown' | 'tap-to-reveal' | 'child-fills'
// Counter kinds: 'a' (first number), 'b' (added), 'leaving' (to take away), 'ghost' (empty slot to find)

const EYE = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24 Q24 6 44 24 Q24 42 4 24Z" fill="#fff" stroke="#2B2140" stroke-width="3.5"/><circle cx="24" cy="24" r="7" fill="#2B2140"/></svg>`;

export function createTenFrame({ frames = 1, mode = 'shown', onStep = () => {}, stepMs = 480, label = 'Ten frame' } = {}) {
  const el = document.createElement('div');
  el.className = 'tf';
  el.dir = 'ltr'; // fills left-to-right like the equation, in every language
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', label);
  const framesEl = document.createElement('div');
  framesEl.className = 'tf-frames';
  el.append(framesEl);

  const cells = [];
  for (let f = 0; f < frames; f++) {
    const fr = document.createElement('div');
    fr.className = 'tf-frame';
    for (let i = 0; i < 10; i++) {
      const c = document.createElement('div');
      c.className = 'tf-cell';
      c.dataset.index = String(f * 10 + i);
      fr.append(c);
      cells.push(c);
    }
    framesEl.append(fr);
  }

  const cover = document.createElement('button');
  cover.className = 'tf-cover';
  cover.type = 'button';
  cover.setAttribute('aria-label', 'Show the ten frame');
  cover.innerHTML = EYE;
  cover.addEventListener('click', () => { el.classList.add('revealed'); onStep('reveal'); });
  el.append(cover);

  let runId = 0;
  let fillCount = 0;
  const wait = (ms, id) => new Promise((res) => setTimeout(() => res(id === runId), ms));

  function counterAt(i) { return cells[i]?.querySelector('.tf-counter'); }
  function place(i, kind, { num, enter } = {}) {
    const cell = cells[i];
    if (!cell) return null;
    cell.innerHTML = '';
    const c = document.createElement('div');
    c.className = `tf-counter k-${kind}${enter ? ` enter-${enter}` : ''}`;
    if (num != null) c.innerHTML = `<span class="tf-num">${num}</span>`;
    cell.append(c);
    if (enter) requestAnimationFrame(() => requestAnimationFrame(() => c.classList.remove(`enter-${enter}`)));
    return c;
  }
  function setNum(i, num) {
    const c = counterAt(i);
    if (!c) return;
    c.innerHTML = num == null ? '' : `<span class="tf-num">${num}</span>`;
  }
  async function stage(id) {
    const ctrs = cells.map((c) => c.querySelector('.tf-counter')).filter(Boolean);
    ctrs.forEach((c) => c.classList.add('enter-pop'));
    for (const c of ctrs) {
      if (!(await wait(stepMs * 0.55, id))) return;
      c.classList.remove('enter-pop');
      onStep('pop');
    }
  }
  function clear() {
    runId++;
    cells.forEach((c) => { c.innerHTML = ''; c.classList.remove('lit'); });
    el.classList.remove('done');
  }

  const api = {
    el,
    get capacity() { return cells.length; },
    clear,

    setMode(m) {
      mode = m;
      el.dataset.mode = m;
      el.classList.toggle('revealed', m === 'shown');
      el.hidden = m === 'hidden';
    },
    setBig(on) { el.classList.toggle('big', !!on); },

    /**
     * Static picture of a question. labels=true numbers every counter.
     * stagger=true is the "counters first" hint: counters pop in one at a time, in order.
     */
    showQuestion(q, { labels = false, stagger = false } = {}) {
      clear();
      const id = runId;
      queueMicrotask(() => { if (stagger && id === runId) stage(id); });
      const n = (i) => (labels ? i + 1 : null);
      const { a, b, c } = q;
      if (q.form === 'count') {
        for (let i = 0; i < a; i++) place(i, 'a', { num: n(i) });
      } else if (q.form === 'result' && q.op === '+') {
        for (let i = 0; i < a; i++) place(i, 'a', { num: n(i) });
        for (let j = 0; j < b; j++) place(a + j, 'b', { num: n(a + j) });
      } else if (q.form === 'result' && q.op === '-') {
        for (let i = 0; i < a; i++) place(i, i >= a - b ? 'leaving' : 'a', { num: i < a - b ? n(i) : null });
      } else if (q.op === '+') { // missing number / bond: a + ? = c
        for (let i = 0; i < a; i++) place(i, 'a', { num: n(i) });
        for (let j = a; j < c; j++) place(j, 'ghost');
      } else { // a - ? = c
        for (let i = 0; i < a; i++) place(i, i >= c ? 'ghost-leaving' : 'a', { num: i < c ? n(i) : null });
      }
    },

    /** Animated explanation. Resolves when finished (or early if cleared). */
    async animateSolution(q, { speed = 1 } = {}) {
      clear();
      const id = runId;
      const step = stepMs / speed;
      const quick = step * 0.35;
      const { a, b, c } = q;
      const lay = async (from, to, kind, enter, numFn, ms, sfx) => {
        for (let i = from; i < to; i++) {
          place(i, kind, { num: numFn(i), enter });
          onStep(sfx);
          if (!(await wait(ms, id))) return false;
        }
        return true;
      };

      if (q.form === 'count') {
        if (!(await lay(0, a, 'a', 'pop', (i) => i + 1, step, 'pop'))) return;
      } else if (q.op === '+') {
        // first number counted quickly, then the added counters slide in one by one
        if (!(await lay(0, a, 'a', 'pop', (i) => i + 1, quick, 'pop'))) return;
        if (!(await wait(step * 0.6, id))) return;
        const isMissing = q.form !== 'result';
        // for missing/bond, number the added counters 1..b so the child sees "how many I added"
        if (!(await lay(a, a + b, 'b', 'slide', (i) => (isMissing ? i - a + 1 : i + 1), step, 'slide'))) return;
      } else {
        // subtraction: show all, then take away from the end, then count what is left
        if (!(await lay(0, a, 'a', 'pop', () => null, quick, 'pop'))) return;
        if (!(await wait(step * 0.6, id))) return;
        const isMissing = q.form !== 'result';
        for (let k = 0; k < b; k++) {
          const i = a - 1 - k;
          const ctr = counterAt(i);
          if (ctr) {
            ctr.classList.add('k-leaving', 'gone');
            if (isMissing) ctr.innerHTML = `<span class="tf-num">${k + 1}</span>`;
          }
          onStep('slide');
          if (!(await wait(step, id))) return;
        }
        if (!isMissing) {
          for (let i = 0; i < c; i++) { setNum(i, i + 1); onStep('pop'); if (!(await wait(quick * 1.4, id))) return; }
        }
      }
      el.classList.add('done');
      await wait(step, id);
    },

    /** child-fills mode: tap cells to place counters. Returns current count via callback. */
    enableFill(onChange = () => {}) {
      fillCount = 0;
      clear();
      cells.forEach((cell, i) => {
        cell.onclick = () => {
          if (mode !== 'child-fills') return;
          // always fill in standard order so the frame stays readable
          if (counterAt(i)) { fillCount = Math.max(0, fillCount - 1); cells[fillCount].innerHTML = ''; }
          else { place(fillCount, 'a', { enter: 'pop' }); fillCount++; }
          onStep('pop');
          onChange(fillCount);
        };
      });
    },

    destroy() { runId++; el.remove(); },
  };
  api.setMode(mode);
  return api;
}
