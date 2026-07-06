const SafeAreaPlugin = require('./SafeAreaPlugin');

const config = {
  projectName: 'english-dictionary',
  date: '2026-7-6',
  designWidth: 430,
  deviceRatio: {
    430: 2,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    webpackChain(chain) {
      // SafeAreaPlugin — 修补 app.wxss 的 page 选择器（CSS 兜底，Babel 已处理 JS 行内 style）
      chain.plugin('safe-area').use(SafeAreaPlugin);
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {
    webpackChain(chain) {
      // SafeAreaPlugin — 修补 app.css 的 .page-container（CSS 兜底，Babel 已处理 JS 行内 style）
      chain.plugin('safe-area').use(SafeAreaPlugin);
    },
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
