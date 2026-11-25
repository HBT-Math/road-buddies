import { pack1 } from './pack1.js';
// Add a pack: create packs/packN.js and list it here.
export const packs = [pack1];
export const getPack = (id) => packs.find((p) => p.id === id) || packs[0];
