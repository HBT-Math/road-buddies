import { carsTheme } from './cars.js';

// Cup themes for Race. Each one reuses the cars theme (vehicle, reward, sounds) and only changes looks.
const scenery = (list) => list;

const cactus = { type: 'cactus', weight: 3, draw(ctx, x, y, u) {
  ctx.fillStyle = '#4FA35A';
  ctx.beginPath(); ctx.roundRect(x - u * 0.1, y - u * 0.9, u * 0.2, u * 0.9, u * 0.1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x - u * 0.32, y - u * 0.62, u * 0.14, u * 0.34, u * 0.07); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + u * 0.18, y - u * 0.72, u * 0.14, u * 0.3, u * 0.07); ctx.fill();
  ctx.fillRect(x - u * 0.3, y - u * 0.36, u * 0.25, u * 0.1); ctx.fillRect(x + u * 0.05, y - u * 0.46, u * 0.25, u * 0.1);
} };
const rock = { type: 'rock', weight: 2, draw(ctx, x, y, u) {
  ctx.fillStyle = '#C98D5E'; ctx.beginPath(); ctx.ellipse(x, y - u * 0.12, u * 0.32, u * 0.18, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#B07A50'; ctx.beginPath(); ctx.ellipse(x + u * 0.22, y - u * 0.06, u * 0.18, u * 0.1, 0, Math.PI, 0); ctx.fill();
} };
const pyramid = { type: 'dune', weight: 1, far: true, draw(ctx, x, y, u) {
  ctx.fillStyle = '#E9B872'; ctx.beginPath(); ctx.moveTo(x - u * 0.9, y); ctx.quadraticCurveTo(x, y - u * 0.9, x + u * 0.9, y); ctx.fill();
} };
const pine = { type: 'pine', weight: 3, draw(ctx, x, y, u) {
  ctx.fillStyle = '#7A5230'; ctx.fillRect(x - u * 0.06, y - u * 0.25, u * 0.12, u * 0.25);
  [[0.25, 0.5], [0.55, 0.42], [0.85, 0.32]].forEach(([dy, hw], i) => {
    ctx.fillStyle = '#3E8E5A'; ctx.beginPath(); ctx.moveTo(x - u * hw, y - u * dy); ctx.lineTo(x, y - u * (dy + 0.45)); ctx.lineTo(x + u * hw, y - u * dy); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x - u * hw * 0.5, y - u * (dy + 0.22)); ctx.lineTo(x, y - u * (dy + 0.45)); ctx.lineTo(x + u * hw * 0.5, y - u * (dy + 0.22)); ctx.fill();
  });
} };
const snowman = { type: 'snowman', weight: 1, draw(ctx, x, y, u) {
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#C9D6E2'; ctx.lineWidth = Math.max(1, u * 0.02);
  ctx.beginPath(); ctx.arc(x, y - u * 0.22, u * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - u * 0.58, u * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#F3722C'; ctx.beginPath(); ctx.moveTo(x, y - u * 0.58); ctx.lineTo(x + u * 0.14, y - u * 0.55); ctx.lineTo(x, y - u * 0.53); ctx.fill();
  ctx.fillStyle = '#2B2140'; ctx.beginPath(); ctx.arc(x - u * 0.05, y - u * 0.62, u * 0.02, 0, Math.PI * 2); ctx.arc(x + u * 0.05, y - u * 0.62, u * 0.02, 0, Math.PI * 2); ctx.fill();
} };
const snowBush = { type: 'snowbush', weight: 2, draw(ctx, x, y, u) {
  ctx.fillStyle = '#FFFFFF';
  [[-0.2, 0.2], [0.15, 0.22], [0, 0.26]].forEach(([dx, r]) => { ctx.beginPath(); ctx.arc(x + dx * u, y - r * u * 0.7, r * u, 0, Math.PI * 2); ctx.fill(); });
} };

export const raceThemes = {
  sunny: carsTheme,
  desert: {
    ...carsTheme, id: 'desert',
    palette: { ...carsTheme.palette, skyTop: '#FFB86B', skyBottom: '#FFE7B8', grassA: '#F2CF8A', grassB: '#EAC37A', hillA: '#E9B872', hillB: '#DDA45C', road: '#9C8570', roadB: '#93806B' },
    scenery: scenery([cactus, rock, pyramid]),
  },
  snow: {
    ...carsTheme, id: 'snow',
    palette: { ...carsTheme.palette, skyTop: '#9CC9F0', skyBottom: '#E6F3FF', grassA: '#F4F8FC', grassB: '#E6EEF6', hillA: '#FFFFFF', hillB: '#DCE8F4', road: '#7D8796', roadB: '#76808F', rumbleB: '#4DABF7' },
    scenery: scenery([pine, snowman, snowBush]),
  },
};
