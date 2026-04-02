const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
  return {
    boot: [],
    css: [],
    extras: [
      'roboto-font',
      'material-icons'
    ],
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },
      vueRouterMode: 'hash',
      env: {
        BACKEND_URL: process.env.BACKEND_URL
      }
    },
    devServer: {
      // To use 'assist-iq' as the hostname:
      // 1. Add "127.0.0.1 assist-iq" to your system hosts file
      // 2. Uncomment the line below:
      // host: 'assist-iq',
      open: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      }
    },
    framework: {
      config: {
        brand: {
          primary: '#1976D2',
          secondary: '#26A69A',
          accent: '#9C27B0',
          dark: '#1D1D1D',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037'
        }
      },
      plugins: ['Notify']
    },
    animations: [],
    ssr: {
      pwa: false,
    },
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMeta: true,
    },
    mwa: {
      injectMwaMeta: true,
    },
    cordova: {},
    capacitor: {
      hideSplashscreen: true
    },
    electron: {},
    bex: {}
  }
});