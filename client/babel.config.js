module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true
    }]
  ],
  plugins: [
    './config/babel-plugin-fix-viewport',
  ]
};
