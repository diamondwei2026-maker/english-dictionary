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
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '搜索',
        iconPath: 'assets/tabbar/icon-search.png',
        selectedIconPath: 'assets/tabbar/icon-search-active.png',
      },
      {
        pagePath: 'pages/libraries/index',
        text: '词库',
        iconPath: 'assets/tabbar/icon-library.png',
        selectedIconPath: 'assets/tabbar/icon-library-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/icon-profile.png',
        selectedIconPath: 'assets/tabbar/icon-profile-active.png',
      },
    ],
  },
});
