import UnoCSS from 'unocss/vite';

export default function () {
  return {
    boot: ['unocss', 'i18n'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      },
      extendViteConf(viteConf) {
        viteConf.plugins = viteConf.plugins || [];
        viteConf.plugins.push(...UnoCSS());

        // vue-i18n build feature flags: enable the runtime message compiler and
        // tree-shake the unused legacy API + prod devtools (IMPLEMENTATION_PLAN.md D45).
        viteConf.define = {
          ...(viteConf.define || {}),
          __VUE_I18N_FULL_INSTALL__: true,
          __VUE_I18N_LEGACY_API__: false,
          __INTLIFY_PROD_DEVTOOLS__: false,
        };
      },
    },

    devServer: {
      open: true,
      port: 9001,
    },

    framework: {
      config: {},
      plugins: [],
    },
  };
}
