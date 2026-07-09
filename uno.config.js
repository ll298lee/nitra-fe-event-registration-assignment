import { defineConfig, presetWind3, presetAttributify, transformerDirectives } from 'unocss';
import { semanticColors } from './src/unocss/semantic.js';
import { uiTheme, uiShortcuts, uiExtendTheme } from './src/unocss/index.js';

function flattenToCssVars(obj, prefix = []) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (value !== null && typeof value === 'object') {
      Object.assign(result, flattenToCssVars(value, path));
    } else if (!String(value).startsWith('var(')) {
      result[`--${path.join('-')}`] = value;
    }
  }
  return result;
}

export default defineConfig({
  presets: [presetWind3(), presetAttributify()],
  transformers: [transformerDirectives()],
  preflights: [
    {
      getCSS: () => {
        const cssVars = flattenToCssVars(semanticColors);
        const body = Object.entries(cssVars)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join('\n');
        return `:root {\n${body}\n}\n`;
      },
    },
  ],
  theme: uiTheme,
  extendTheme: [uiExtendTheme],
  shortcuts: uiShortcuts,
});
