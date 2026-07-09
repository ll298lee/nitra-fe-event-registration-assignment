import UnoCSS from 'unocss/vite';

export default function () {
  return {
    boot: ['unocss'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      },
      extendViteConf(viteConf) {
        viteConf.plugins = viteConf.plugins || [];
        viteConf.plugins.push(...UnoCSS());
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
