export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/word-detail/index',
    'pages/libraries/index',
    'pages/library-words/index',
    'pages/profile/index',
    'pages/auth/index',
    'pages/admin/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F9FC',
    navigationBarTitleText: '认知英语词典',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F9FC',
  },
});
