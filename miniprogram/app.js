App({
  globalData: {
    userInfo: null,
    token: null,
    currentGroup: null,
    apiBase: 'https://melo-backend-production-2815.up.railway.app',
    wsUrl: 'wss://melo-backend-production-2815.up.railway.app/ws'
  },

  onLaunch() {
    this.globalData.navLayout = this.getNavLayout();

    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.validateStoredSession(token);
    }

    wx.loadFontFace({
      family: 'Courier Prime',
      source: 'url("https://cdn.jsdelivr.net/npm/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2")',
      success: () => console.log('Courier Prime loaded'),
      fail: () => console.warn('Courier Prime failed, using fallback')
    });

    wx.loadFontFace({
      family: 'Inter',
      source: 'url("https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff2")',
      success: () => console.log('Inter loaded'),
      fail: () => console.warn('Inter failed, using fallback')
    });
  },

  getNavLayout() {
    const systemInfo = wx.getSystemInfoSync();
    let menuButton = null;

    try {
      menuButton = wx.getMenuButtonBoundingClientRect();
    } catch (err) {
      menuButton = null;
    }

    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const navOffset = 8;
    const top = (menuButton && menuButton.top ? menuButton.top : statusBarHeight + 6) + navOffset;
    const height = menuButton && menuButton.height ? menuButton.height : 32;
    const bottom = top + height;
    const navHeight = bottom + 8;

    return {
      navbarStyle: `height: ${navHeight}px; padding-top: 0;`,
      backStyle: `top: ${top}px; height: ${height}px;`,
      titleStyle: `top: ${top}px; height: ${height}px; line-height: ${height}px;`,
      downloadTop: `${navHeight + 8}px`,
      placeholderStyle: `height: ${navHeight}px;`
    };
  },

  getNavBarStyle() {
    this.globalData.navLayout = this.getNavLayout();
    return this.globalData.navLayout;
  },

  validateStoredSession(token) {
    wx.request({
      url: `${this.globalData.apiBase}/users/me`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          wx.setStorageSync('userInfo', res.data);
          this.globalData.userInfo = res.data;
          this.refreshStoredGroups(token);
          return;
        }
        if (res.statusCode === 401 || res.statusCode === 404) {
          this.clearAuthStorage();
        }
      },
      fail: () => {}
    });
  },

  refreshStoredGroups(token) {
    wx.request({
      url: `${this.globalData.apiBase}/groups`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          wx.setStorageSync('groups', res.data.groups || []);
          return;
        }
        if (res.statusCode === 401) {
          this.clearAuthStorage();
        }
      },
      fail: () => {}
    });
  },

  clearAuthStorage() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('groups');
    wx.removeStorageSync('currentGroup');
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.currentGroup = null;
    setTimeout(() => {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      if (!current || current.route !== 'pages/auth/auth') {
        wx.reLaunch({ url: '/pages/auth/auth' });
      }
    }, 0);
  }
});
