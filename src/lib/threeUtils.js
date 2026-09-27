export const PALETTE = {
  light: {
    bg: '#efece4',
    ink: '#111111',
    acc: '#ff4d1a',
    grass: '#b7dc9a',
    category: {
      post: '#b7dc9a',
      nonmetal: '#a7c4f2',
      alkali: '#ff9b85',
      alkaline: '#ffc46b',
      transition: '#f3e27a',
      metalloid: '#8fd6c4',
      halogen: '#c1b4f0',
      noble: '#e6b3e0',
      lanthanide: '#f2b6c6',
      actinide: '#c9c5b8',
    },
  },
  dark: {
    bg: '#0d0d0c',
    ink: '#f1eee6',
    acc: '#d4ff3a',
    grass: '#1a2a1a',
    category: {
      post: '#2f5a1f',
      nonmetal: '#1f3f7a',
      alkali: '#7f2a1c',
      alkaline: '#7a4a12',
      transition: '#6b5d10',
      metalloid: '#17564a',
      halogen: '#3b2f7a',
      noble: '#612a63',
      lanthanide: '#7a2a45',
      actinide: '#3d3b34',
    },
  },
};

export const getPalette = (theme = 'light') => PALETTE[theme] || PALETTE.light;

export const rand = (min, max) => min + Math.random() * (max - min);