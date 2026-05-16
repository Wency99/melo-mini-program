const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    username: '',
    usernameSaved: false,
    savingUsername: false
  },

  getErrorMessage(err, fallback) {
    const message = err && (err.message || err.error);
    if (message === 'Username already exists') return '这个用户名已经被使用';
    return message || fallback;
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const wechatProfile = wx.getStorageSync('wechatProfile') || {};
    const savedName = userInfo.displayName || userInfo.username || '';
    const shouldUseWechatName = wechatProfile.displayName && (!savedName || this.isGeneratedWechatName(savedName));
    const username = shouldUseWechatName ? wechatProfile.displayName : savedName;
    this.setData({ username, usernameSaved: !!username && !shouldUseWechatName });
  },

  isGeneratedWechatName(name) {
    return /^用户[A-Za-z0-9_-]{4,}$/.test((name || '').trim());
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value, usernameSaved: false });
  },

  async saveUsername() {
    const username = this.data.username.trim();
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }

    this.setData({ savingUsername: true });
    try {
      let userInfo = wx.getStorageSync('userInfo') || {};
      const res = await api.updateUserProfile({ username, displayName: username });
      userInfo = res.user || { ...userInfo, username, displayName: username };

      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('usernameSetupDone', true);
      app.globalData.userInfo = userInfo;
      this.setData({ username, usernameSaved: true });
      wx.redirectTo({ url: '/pages/group-setup/group-setup' });
    } catch (err) {
      wx.showToast({ title: this.getErrorMessage(err, '用户名保存失败'), icon: 'none' });
    } finally {
      this.setData({ savingUsername: false });
    }
  }
});
