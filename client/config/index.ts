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

// 解包 TypeScript export default → CJS require：无 esModuleInterop 时
// TS 会将 export default 编译为 exports.default，导致 merge 丢失整个 dev/prod 配置
function unwrapDefault(m: Record<string, unknown>): Record<string, unknown> {
  return (m.default as Record<string, unknown>) || m;
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, unwrapDefault(require('./dev')));
  }
  return merge({}, config, unwrapDefault(require('./prod')));
};
