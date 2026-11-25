// Six accent swatches. Each also carries a shape so colour is never the only signal.
export const accentColors = [
  { id: 'red',    hex: '#E63946', dark: '#A4222D', shape: 'heart' },
  { id: 'orange', hex: '#F3722C', dark: '#B4501A', shape: 'triangle' },
  { id: 'yellow', hex: '#F9C74F', dark: '#C39320', shape: 'star' },
  { id: 'green',  hex: '#43AA8B', dark: '#2B7A62', shape: 'square' },
  { id: 'blue',   hex: '#3A86FF', dark: '#1F5BC0', shape: 'circle' },
  { id: 'purple', hex: '#8E5CD9', dark: '#5F3AA0', shape: 'diamond' },
];
export const getColor = (id) => accentColors.find((c) => c.id === id) || accentColors[4];
