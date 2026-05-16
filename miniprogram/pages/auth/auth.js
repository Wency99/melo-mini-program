const app = getApp();
const api = require('../../services/api.js');

Page({
  data: { loading: false },

  onLoad() {
    console.log('auth page loaded');
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('token exists, validating session');
      this.validateSessionAndNavigate();
    }
  },

  async validateSessionAndNavigate() {
    try {
      const [user, groupsRes] = await Promise.all([api.getMe(), api.getGroups()]);
      const groups = groupsRes.groups || [];
      wx.setStorageSync('userInfo', user);
      wx.setStorageSync('groups', groups);
      app.globalData.token = wx.getStorageSync('token');
      app.globalData.userInfo = user;
      this.checkAndNavigate();
    } catch (err) {
      console.warn('Stored session invalid', err);
      api.clearAuthStorage();
      app.globalData.token = null;
      app.globalData.userInfo = null;
    }
  },

  handleWechatLogin() {
    console.log('handleWechatLogin called');
    if (this.data.loading) return;
    this.setData({ loading: true });

    this.getWechatProfile().then((profile) => {
      if (profile.displayName || profile.photoUrl) {
        wx.setStorageSync('wechatProfile', profile);
      }
      wx.login({
        provider: 'weixin',
        success: async (res) => {
          console.log('wx.login success', res);
          if (!res.code) {
            wx.showToast({ title: '微信登录凭证获取失败', icon: 'none' });
            this.setData({ loading: false });
            return;
          }
          try {
            const data = await api.wechatLogin(res.code, profile);
            console.log('wechatLogin response', data);
            wx.setStorageSync('token', data.token);
            wx.setStorageSync('userInfo', data.user);
            wx.setStorageSync('groups', data.groups || []);
            app.globalData.token = data.token;
            app.globalData.userInfo = data.user;
            this.checkAndNavigate();
          } catch (err) {
            console.error('login error', err);
            wx.showToast({ title: '登录失败: ' + (err.message || '未知错误'), icon: 'none' });
          } finally {
            this.setData({ loading: false });
          }
        },
        fail: (err) => {
          console.error('wx.login fail', err);
          wx.showToast({ title: '微信登录失败', icon: 'none' });
          this.setData({ loading: false });
        }
      });
    });
  },

  getWechatProfile() {
    return new Promise((resolve) => {
      if (!wx.getUserProfile) {
        resolve({});
        return;
      }

      wx.getUserProfile({
        desc: '用于展示微信昵称作为默认用户名',
        success: (res) => {
          const userInfo = res.userInfo || {};
          resolve({
            displayName: userInfo.nickName || '',
            photoUrl: userInfo.avatarUrl || ''
          });
        },
        fail: () => resolve({})
      });
    });
  },

  checkAndNavigate() {
    const groups = wx.getStorageSync('groups') || [];
    const userInfo = wx.getStorageSync('userInfo') || {};
    const displayName = userInfo.displayName || userInfo.username || '';
    const usernameSetupDone = wx.getStorageSync('usernameSetupDone');
    if (groups.length > 0) {
      wx.navigateTo({ url: '/pages/camera/camera' });
    } else if (usernameSetupDone && displayName && !this.isGeneratedWechatName(displayName)) {
      wx.redirectTo({ url: '/pages/group-setup/group-setup' });
    } else {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
    }
  },

  isGeneratedWechatName(name) {
    return /^用户[A-Za-z0-9_-]{4,}$/.test((name || '').trim());
  }
});
