import * as colors from './colors.js';
import { semanticShortcuts } from './semantic.js';

export const fontSize = {
  lg: ['var(--font-size-lg)', 'var(--line-height-lg)'],
  md: ['var(--font-size-md)', 'var(--line-height-md)'],
  sm: ['var(--font-size-sm)', 'var(--line-height-sm)'],
};

export const fontWeight = {
  bold: '630',
  semibold: '610',
  medium: '570',
  regular: '485',
};

export const lineHeight = {
  lg: 'var(--line-height-lg)',
  md: 'var(--line-height-md)',
  sm: 'var(--line-height-sm)',
};

export const letterSpacing = {
  none: '0',
};

export const typographyShortcuts = [
  {
    'text-h1': 'text-[length:var(--font-size-h1)] line-height-[var(--line-height-h1)] font-bold',
    'text-h2': 'text-[length:var(--font-size-h2)] line-height-[var(--line-height-h2)] font-bold',
    'text-h3': 'text-[length:var(--font-size-h3)] line-height-[var(--line-height-h3)] font-bold',
    'text-h4': 'text-[length:var(--font-size-h4)] line-height-[var(--line-height-h4)] font-bold',
    'text-subtitle1':
      'text-[length:var(--font-size-subtitle1)] line-height-[var(--line-height-subtitle1)] font-semibold',
    'text-subtitle2':
      'text-[length:var(--font-size-subtitle2)] line-height-[var(--line-height-subtitle2)] font-semibold',
  },
];

export const breakpoints = {
  tablet: '768px',
  desktop: '1024px',
};

export const uiTheme = {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  zIndex: {
    banner: '1000',
    'banner-alert': '1001',
    toast: '2000',
  },
};

export const uiExtendTheme = (theme) => ({
  ...theme,
  breakpoints: {
    ...(theme?.breakpoints ?? {}),
    ...breakpoints,
  },
});

export const uiShortcuts = [...typographyShortcuts, ...semanticShortcuts];
