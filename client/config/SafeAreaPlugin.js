/**
 * SafeAreaPlugin — CSS / WXSS 底部安全区兜底插件。
 *
 * JS 行内 style 中的 "100vh" 已由 Babel 插件（babel-plugin-fix-viewport）
 * 在 AST 层面统一替换为 calc(100vh - 100px)，覆盖三端。
 * 本插件仅处理 CSS 文件中 Babel 无法触及的部分。
 */

const TABBAR_RESERVE = '100px';

class SafeAreaPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('SafeAreaPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'SafeAreaPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
        },
        (assets) => {
          Object.entries(assets).forEach(([filename, asset]) => {
            let source = asset.source();
            let modified = false;

            // WXSS（小程序）—— page 选择器注入 padding-bottom
            if (/app\.wxss$/.test(filename)) {
              source = source.replace(
                /(page\{[^}]*)(\})/,
                `$1;padding-bottom:${toRpx(TABBAR_RESERVE)}$2`,
              );
              modified = true;
            }

            // CSS（H5 浏览器）—— min-height:100vh → calc
            if (/\.css$/.test(filename)) {
              const before = source;
              source = source.replace(
                /min-height:\s*100vh/g,
                `min-height:calc(100vh - ${TABBAR_RESERVE})`,
              );
              if (source !== before) modified = true;
            }

            if (modified) {
              compilation.updateAsset(
                filename,
                new compiler.webpack.sources.RawSource(source),
              );
            }
          });
        },
      );
    });
  }
}

function toRpx(pxStr) {
  return String(parseInt(pxStr, 10) * 2) + 'rpx';
}

module.exports = SafeAreaPlugin;
