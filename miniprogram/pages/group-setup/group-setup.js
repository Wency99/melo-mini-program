const app = getApp();
const api = require('../../services/api.js');

const DEFAULT_GROUP_AVATARS = [
  '/images/avatars/puzzle-1.png',
  '/images/avatars/puzzle-2.png',
  '/images/avatars/puzzle-3.png',
  '/images/avatars/puzzle-4.png'
];

Page({
  data: {
    tab: 'join',
    inviteCode: '',
    groupName: '',
    loading: false,
    showCodeModal: false,
    createdCode: '',
    members: []
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const displayName = userInfo.displayName || userInfo.username || '';
    if (!displayName || this.isGeneratedWechatName(displayName)) {
      wx.redirectTo({ url: '/pages/onboarding/onboarding' });
    }
  },

  getErrorMessage(err, fallback) {
    const message = err && (err.message || err.error);
    if (message === 'Username already exists') return '这个用户名已经被使用';
    return message || fallback;
  },

  isGeneratedWechatName(name) {
    return /^用户[A-Za-z0-9_-]{4,}$/.test((name || '').trim());
  },

  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); },
  onCodeInput(e) { this.setData({ inviteCode: e.detail.value }); },
  onNameInput(e) { this.setData({ groupName: e.detail.value }); },

  async handleJoin() {
    if (!this.data.inviteCode || this.data.inviteCode.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.joinGroup(this.data.inviteCode);
      const group = this.withCurrentUserName(res.group);
      wx.setStorageSync('groups', [group]);
      app.globalData.currentGroup = group;
      wx.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(() => wx.redirectTo({ url: '/pages/camera/camera' }), 900);
    } catch (err) {
      wx.showToast({ title: this.getErrorMessage(err, '加入失败'), icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async handleCreate() {
    if (!this.data.groupName.trim()) {
      wx.showToast({ title: '请输入群组名称', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await api.createGroup(this.data.groupName);
      const group = this.withCurrentUserName(res.group);
      wx.setStorageSync('groups', [group]);
      app.globalData.currentGroup = group;
      this.setData({
        showCodeModal: true,
        createdCode: group.inviteCode,
        members: group.members || []
      });
    } catch (err) {
      wx.showToast({ title: this.getErrorMessage(err, '创建失败'), icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.createdCode,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    });
  },

  withCurrentUserName(group) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!group || !userInfo.uid) return group;

    return {
      ...group,
      members: this.normalizeMembers(group.members || []).map(member => (
        member.uid === userInfo.uid
          ? { ...member, username: userInfo.username, displayName: userInfo.displayName, photoUrl: userInfo.photoUrl }
          : member
      ))
    };
  },

  normalizeMembers(members) {
    const usedAvatars = new Set();

    return (members || []).map((member, index) => {
      const existingAvatar = member.avatarUrl || member.avatar_url || '';
      const avatarUrl = existingAvatar || this.getAvailableGroupAvatar(usedAvatars, index);
      if (avatarUrl) usedAvatars.add(avatarUrl);

      return {
        ...member,
        avatarUrl
      };
    });
  },

  getAvailableGroupAvatar(usedAvatars, index) {
    const available = DEFAULT_GROUP_AVATARS.filter(avatar => !usedAvatars.has(avatar));
    return available[index % available.length] || DEFAULT_GROUP_AVATARS[index % DEFAULT_GROUP_AVATARS.length];
  },

  goToMelo() {
    wx.redirectTo({ url: '/pages/camera/camera' });
  }
});
