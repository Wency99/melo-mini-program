const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    username: '',
    usernameSaved: false,
    savingUsername: false,
    city: '',
    citySaved: false,
    showCityPicker: false
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
    const city = userInfo.city || '';
    this.setData({
      username,
      usernameSaved: !!username && !shouldUseWechatName,
      city,
      citySaved: !!city
    });
  },

  isGeneratedWechatName(name) {
    return /^用户[A-Za-z0-9_-]{4,}$/.test((name || '').trim());
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value, usernameSaved: false });
  },

  onOpenCityPicker() {
    this.setData({ showCityPicker: true });
  },

  onCityPickerClose() {
    this.setData({ showCityPicker: false });
  },

  onCitySelect(e) {
    const { city } = e.detail;
    this.setData({
      city: city.name,
      citySaved: true,
      showCityPicker: false
    });
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
      const updateData = { username, displayName: username };
      if (this.data.city) {
        updateData.city = this.data.city;
      }
      const res = await api.updateUserProfile(updateData);
      userInfo = res.user || { ...userInfo, ...updateData };

      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('usernameSetupDone', true);
      app.globalData.userInfo = userInfo;
      this.setData({ username, usernameSaved: true, citySaved: true });
      wx.redirectTo({ url: '/pages/group-setup/group-setup' });
    } catch (err) {
      wx.showToast({ title: this.getErrorMessage(err, '用户名保存失败'), icon: 'none' });
    } finally {
      this.setData({ savingUsername: false });
    }
  }
});
