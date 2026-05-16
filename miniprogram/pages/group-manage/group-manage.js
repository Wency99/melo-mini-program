const api = require('../../services/api.js');
const app = getApp();

const DEFAULT_GROUP_AVATARS = [
  '/images/avatars/puzzle-1.png',
  '/images/avatars/puzzle-2.png',
  '/images/avatars/puzzle-3.png',
  '/images/avatars/puzzle-4.png'
];
const PINYIN_INITIALS = 'ABCDEFGHJKLMNPQRSTWXYZ';
const PINYIN_BOUNDARIES = '阿八嚓咑妸发旮哈讥咔垃嘸拏噢妑七呥仨他屲夕丫帀';

Page({
  data: {
    groupId: '',
    group: null,
    members: [],
    nav: {},
    currentUserId: ''
  },

  onLoad(query) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ groupId: query.id || '', currentUserId: userInfo.uid || '', nav: app.getNavBarStyle() });
    this.loadGroup();
  },

  onShow() {
    if (this.data.groupId) this.loadGroup();
  },

  async loadGroup() {
    if (!this.data.groupId) return;

    try {
      const res = await api.getGroupInfo(this.data.groupId);
      const group = res.group;
      if (!group) {
        this.setData({ group: null, members: [] });
        return;
      }

      const members = this.buildMembers(group.members || []);
      this.setData({ group, members });
      this.updateCachedGroup(group);
    } catch (err) {
      console.warn('Failed to load group', err);
      wx.showToast({ title: err.error || '加载失败', icon: 'none' });
    }
  },

  buildMembers(members) {
    const usedAvatars = new Set();

    return members.map((member, index) => {
      const name = member.displayName || member.username || '未知';
      const existingAvatar = member.avatarUrl || member.avatar_url || '';
      const avatarUrl = existingAvatar || this.getAvailableGroupAvatar(usedAvatars, index);
      if (avatarUrl) usedAvatars.add(avatarUrl);

      return {
        ...member,
        displayName: name,
        avatarUrl,
        avatarLetter: this.getAvatarLetter(name)
      };
    });
  },

  getAvailableGroupAvatar(usedAvatars, index) {
    const available = DEFAULT_GROUP_AVATARS.filter(avatar => !usedAvatars.has(avatar));
    return available[index % available.length] || DEFAULT_GROUP_AVATARS[index % DEFAULT_GROUP_AVATARS.length];
  },

  getAvatarLetter(name) {
    const text = (name || '').trim();
    if (!text) return '?';

    const first = text[0];
    if (/^[a-zA-Z0-9]$/.test(first)) return first.toUpperCase();
    if (!/[\u4e00-\u9fff]/.test(first)) return first.toUpperCase();

    for (let i = PINYIN_BOUNDARIES.length - 1; i >= 0; i -= 1) {
      if (first.localeCompare(PINYIN_BOUNDARIES[i], 'zh-Hans-CN') >= 0) {
        return PINYIN_INITIALS[i] || first;
      }
    }
    return first;
  },

  updateCachedGroup(group) {
    const groups = wx.getStorageSync('groups') || [];
    const nextGroups = groups.map(item => (item.id === group.id ? group : item));
    wx.setStorageSync('groups', nextGroups);
  },

  removeCachedGroup(groupId) {
    const groups = (wx.getStorageSync('groups') || []).filter(item => item.id !== groupId);
    wx.setStorageSync('groups', groups);
    return groups;
  },

  removeMember(e) {
    const userId = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name || '该成员';
    if (!userId) return;

    wx.showModal({
      title: '删除成员',
      content: `确定将 ${name} 移出群组吗？`,
      confirmText: '删除',
      confirmColor: '#FF9999',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          wx.showLoading({ title: '删除中...' });
          await api.removeMember(this.data.groupId, userId);
          await this.loadGroup();
          wx.showToast({ title: '已删除', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: err.error || '删除失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  deleteGroup() {
    wx.showModal({
      title: '解散群组',
      content: '解散后群组成员、照片和历史时刻都会被删除，确定继续吗？',
      confirmText: '解散',
      confirmColor: '#FF9999',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          wx.showLoading({ title: '解散中...' });
          await api.deleteGroup(this.data.groupId);
          const groups = this.removeCachedGroup(this.data.groupId);
          wx.showToast({ title: '已解散', icon: 'success' });
          setTimeout(() => {
            if (groups.length > 0) {
              wx.redirectTo({ url: '/pages/profile/profile' });
            } else {
              wx.redirectTo({ url: '/pages/group-setup/group-setup' });
            }
          }, 600);
        } catch (err) {
          wx.showToast({ title: err.error || '解散失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  leaveGroup() {
    wx.showModal({
      title: '退出群组',
      content: '退出后将不再看到这个群组的时刻，确定继续吗？',
      confirmText: '退出',
      confirmColor: '#FF9999',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          wx.showLoading({ title: '退出中...' });
          await api.leaveGroup(this.data.groupId);
          const groups = this.removeCachedGroup(this.data.groupId);
          wx.showToast({ title: '已退出', icon: 'success' });
          setTimeout(() => {
            if (groups.length > 0) {
              wx.redirectTo({ url: '/pages/profile/profile' });
            } else {
              wx.redirectTo({ url: '/pages/group-setup/group-setup' });
            }
          }, 600);
        } catch (err) {
          wx.showToast({ title: err.error || '退出失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({ url: '/pages/profile/profile' });
  }
});
