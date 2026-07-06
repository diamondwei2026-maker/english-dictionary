/**
 * Babel 插件 — AST 级别修复 viewport 单位 + 注入底部安全距离。
 *
 * 对每个 style 对象中 minHeight / height: '100vh' 的 ObjectProperty：
 *   1. 将值替换为 calc(100vh - 100px)
 *   2. 对 minHeight 项额外注入 paddingBottom: '80px'
 *      （追加到 ObjectExpression 末尾，覆盖可能存在的 padding 简写）
 *
 * Babel AST 级别操作，全平台（小程序 / H5 / APP）统一生效，
 * 不依赖字符串正则，不受 webpack chunk 拆分或变量混淆影响。
 */
module.exports = function ({ types: t }) {
  return {
    visitor: {
      ObjectProperty(path) {
        // 只处理 key 是 Identifier 且 value 是 StringLiteral '100vh' 的情况
        if (
          !t.isIdentifier(path.node.key) ||
          !t.isStringLiteral(path.node.value, { value: '100vh' })
        ) {
          return;
        }

        const keyName = path.node.key.name;

        // 只处理 minHeight 和 height
        if (keyName !== 'minHeight' && keyName !== 'height') {
          return;
        }

        // 替换 value: '100vh' → 'calc(100vh - 100px)'
        path.node.value = t.stringLiteral('calc(100vh - 100px)');

        // minHeight 场景：在父级 ObjectExpression 末尾注入 paddingBottom
        if (keyName === 'minHeight') {
          const obj = path.parent;
          if (t.isObjectExpression(obj)) {
            obj.properties.push(
              t.objectProperty(
                t.identifier('paddingBottom'),
                t.stringLiteral('80px'),
              ),
            );
          }
        }
      },
    },
  };
};
