import { h, iconButton, logo } from '../dom.js';
import { icons, shapeSvg } from '../icons.js';
import { characters, faceSvg, getCharacter } from '../../data/characters.js';
import { accentColors, getColor } from '../../data/colors.js';
import { themes, upcomingThemes } from '../../data/themes/index.js';
import { t } from '../../data/i18n/index.js';
import { speech } from '../../audio/speech.js';
import { sound } from '../../audio/sound.js';
import { svgToImage } from '../draw.js';

// Three picture-only steps: buddy -> colour -> road theme. No text needed to choose.
export function newProfile(app) {
  const pick = { animal: null, color: null, theme: null };
  let step = 0;
  const body = h('div.step');
  const backBtn = iconButton(icons.back, t('btn.back'), () => {
    if (step === 0) app.go(app.store.profiles().length ? 'profiles' : 'newProfile');
    else show(step - 1);
  }, 'back-btn');
  if (!app.store.profiles().length) backBtn.hidden = true;
  const dots = h('div.step-dots', { 'aria-hidden': 'true' });
  const el = h('div.screen.menu', {}, logo('enrich', 'logo-corner'), body, dots, backBtn);

  function show(n) {
    step = n;
    backBtn.hidden = n === 0 && !app.store.profiles().length;
    dots.innerHTML = [0, 1, 2].map((i) => `<span class="${i === n ? 'on' : ''}"></span>`).join('');
    body.innerHTML = '';
    [companionStep, colorStep, themeStep][n]();
  }

  function companionStep() {
    const grid = h('div.pick-grid.faces');
    for (const ch of characters) {
      grid.append(h('button.pick-card.face-card', {
        type: 'button', 'aria-label': `${ch.name} (${t('animal.' + ch.id)})`,
        onclick: (e) => {
          sound.unlock(); sound.play('select');
          pick.animal = ch.id;
          speech.say(`${ch.name}!`, ch.voiceStyle);
          e.currentTarget.classList.add('chosen');
          setTimeout(() => show(1), 550);
        },
      }, h('span.face', { html: faceSvg(ch, 130) }), h('span.card-name', {}, ch.name)));
    }
    body.append(h('h1.title', {}, t('pick.companion')), grid);
    speech.say(t('pick.companion'));
  }

  function colorStep() {
    const ch = getCharacter(pick.animal);
    const preview = h('canvas.car-preview', { width: '360', height: '300', 'aria-hidden': 'true' });
    const theme = themes[0];
    let faceImg = null;
    svgToImage(faceSvg(ch, 240)).then((img) => { faceImg = img; draw(); });
    function draw() {
      const ctx = preview.getContext('2d');
      ctx.clearRect(0, 0, 360, 300);
      const c = getColor(pick.color || 'blue');
      theme.vehicle(ctx, { x: 180, y: 285, w: 280, accent: c.hex, accentDark: c.dark, faceImg });
    }
    const go = iconButton(icons.check, t('btn.ok'), () => show(2), 'go-btn big-go');
    go.hidden = !pick.color;
    const grid = h('div.pick-grid.swatches');
    for (const c of accentColors) {
      const b = h('button.pick-card.swatch', {
        type: 'button', 'aria-label': t('color.' + c.id), style: `--sw:${c.hex};--sw-dark:${c.dark}`,
        'aria-pressed': String(pick.color === c.id),
        onclick: () => {
          sound.unlock(); sound.play('select');
          pick.color = c.id; draw();
          grid.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          go.hidden = false;
        },
      }, h('span.sw-shape', { html: shapeSvg(c.shape) }));
      grid.append(b);
    }
    body.append(h('h1.title', {}, t('pick.color')), h('div.color-row', {}, preview, grid, go));
    speech.say(t('pick.color'));
    draw();
  }

  function themeStep() {
    const grid = h('div.pick-grid.themes');
    for (const th of themes) {
      grid.append(h('button.pick-card.theme-card', {
        type: 'button', 'aria-label': t(th.nameKey),
        onclick: () => {
          sound.play('select');
          pick.theme = th.id;
          app.store.addProfile(pick);
          app.go('map');
        },
      }, h('span.theme-art', { html: th.icon })));
    }
    for (const th of upcomingThemes) {
      grid.append(h('div.pick-card.theme-card.locked', { 'aria-label': t('theme.locked') },
        h('span.theme-art', { html: th.icon }), h('span.lock-badge', { html: icons.lock })));
    }
    body.append(h('h1.title', {}, t('pick.theme')), grid);
    speech.say(t('pick.theme'));
  }

  show(0);
  return { el };
}
