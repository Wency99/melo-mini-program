function clearAuthStorage() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('groups');
  wx.removeStorageSync('currentGroup');
  wx.removeStorageSync('usernameSetupDone');
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.token = null;
    app.globalData.userInfo = null;
    app.globalData.currentGroup = null;
  }
}

function relaunchAuthIfNeeded() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  if (!current || current.route !== 'pages/auth/auth') {
    wx.reLaunch({ url: '/pages/auth/auth' });
  }
}

function request(options) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const token = wx.getStorageSync('token');
    wx.request({
      url: app.globalData.apiBase + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401 || (options.url === '/users/me' && res.statusCode === 404)) {
          clearAuthStorage();
          relaunchAuthIfNeeded();
          reject(new Error('Unauthorized'));
        } else {
          const message = res.data && (res.data.error || res.data.message) ? (res.data.error || res.data.message) : '请求失败';
          const error = new Error(message);
          error.statusCode = res.statusCode;
          error.code = res.data && res.data.code;
          error.data = res.data;
          reject(error);
        }
      },
      fail: reject
    });
  });
}

module.exports = {
  clearAuthStorage,
  wechatLogin: (code, profile = {}) => request({ url: '/auth/wechat', method: 'POST', data: { code, ...profile } }),
  getMe: () => request({ url: '/users/me' }),
  updateUserProfile: (data) => request({ url: '/users/me', method: 'PATCH', data }),
  searchCities: (query) => request({ url: '/cities', method: 'GET', data: { q: query } }),
  getGroups: () => request({ url: '/groups' }),
  createGroup: (name) => request({ url: '/groups', method: 'POST', data: { name } }),
  joinGroup: (inviteCode) => request({ url: '/groups/join', method: 'POST', data: { inviteCode } }),
  getGroupPosts: (groupId) => request({ url: `/groups/${groupId}/posts` }),
  createPost: (groupId, imageUrl, caption, cityName, hourMark) =>
    request({ url: `/groups/${groupId}/posts`, method: 'POST', data: { imageUrl, caption, cityName, hourMark } }),
  getGroupInfo: (groupId) => request({ url: `/groups/${groupId}` }),
  removeMember: (groupId, userId) =>
    request({ url: `/groups/${groupId}/members/${userId}`, method: 'DELETE' }),
  leaveGroup: (groupId) => request({ url: `/groups/${groupId}/leave`, method: 'DELETE' }),
  deleteGroup: (groupId) => request({ url: `/groups/${groupId}`, method: 'DELETE' })
};
