const app = getApp();
const api = require('../../services/api.js');

const MAX_GROUP_COUNT = 5;
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
    userInfo: null,
    groups: [],
    currentGroupId: '',
    currentAvatarUrl: '',
    nav: app.getNavBarStyle(),
    avatarLetter: '?',
    editingUsername: false,
    usernameDraft: '',
    savingUsername: false,
    showCityPicker: false
  },

  onLoad() {
    this.setData({ nav: app.getNavBarStyle() });
    this.loadUserData();
  },
  onShow() {
    this.setData({ nav: app.getNavBarStyle() });
    this.loadUserData();
  },

  loadUserData() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const groups = wx.getStorageSync('groups') || [];
    const currentGroupId = groups[0]?.id || '';
    const displayName = userInfo.displayName || '';
    const displayGroups = this.buildDisplayGroups(groups, userInfo);
    this.setData({
      userInfo,
      groups: displayGroups,
      currentGroupId,
      currentAvatarUrl: this.getCurrentAvatarUrl(displayGroups, currentGroupId, userInfo),
      avatarLetter: displayName ? displayName[0].toUpperCase() : '?',
      usernameDraft: displayName || userInfo.username || ''
    });
    this.refreshGroups();
  },

  async refreshGroups() {
    try {
      const res = await api.getGroups();
      const currentGroupId = this.data.currentGroupId;
      const groups = res.groups || [];
      const sortedGroups = currentGroupId
        ? groups.slice().sort((a, b) => (a.id === currentGroupId ? -1 : b.id === currentGroupId ? 1 : 0))
        : groups;
      const nextCurrentGroupId = currentGroupId || (sortedGroups[0] && sortedGroups[0].id) || '';
      const displayGroups = this.buildDisplayGroups(sortedGroups, this.data.userInfo || {});
      wx.setStorageSync('groups', sortedGroups);
      this.setData({
        groups: displayGroups,
        currentGroupId: nextCurrentGroupId,
        currentAvatarUrl: this.getCurrentAvatarUrl(displayGroups, nextCurrentGroupId, this.data.userInfo || {})
      });
    } catch (err) {
      console.warn('Failed to refresh groups', err);
    }
  },

  buildDisplayGroups(groups, userInfo) {
    return (groups || []).map(group => ({
      ...group,
      displayMembers: this.buildDisplayMembers(group, userInfo)
    }));
  },

  buildDisplayMembers(group, userInfo) {
    let members = group.members || [];
    if ((!members || members.length === 0) && userInfo && userInfo.uid) {
      members = [{ uid: userInfo.uid, username: userInfo.username, displayName: userInfo.displayName }];
    }

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

  getCurrentAvatarUrl(groups, currentGroupId, userInfo) {
    const uid = userInfo && userInfo.uid;
    const group = (groups || []).find(item => item.id === currentGroupId) || (groups || [])[0];
    const currentMember = group && (group.displayMembers || []).find(member => member.uid === uid);
    return (currentMember && currentMember.avatarUrl) || DEFAULT_GROUP_AVATARS[0];
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

  onOpenCityPicker() {
    this.setData({ showCityPicker: true });
  },

  onCityPickerClose() {
    this.setData({ showCityPicker: false });
  },

  async onCitySelect(e) {
    const { city } = e.detail;
    this.setData({ showCityPicker: false });

    try {
      let userInfo = this.data.userInfo || {};
      const res = await api.updateUserProfile({ city: city.name });
      userInfo = res.user || { ...userInfo, city: city.name };
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.userInfo = userInfo;
      this.setData({ userInfo });
      wx.showToast({ title: '城市已更新', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
  },

  startEditUsername() {
    const userInfo = this.data.userInfo || {};
    this.setData({
      editingUsername: true,
      usernameDraft: userInfo.displayName || userInfo.username || ''
    });
  },

  cancelEditUsername() {
    const userInfo = this.data.userInfo || {};
    this.setData({
      editingUsername: false,
      usernameDraft: userInfo.displayName || userInfo.username || ''
    });
  },

  onUsernameDraftInput(e) {
    this.setData({ usernameDraft: e.detail.value });
  },

  async saveUsername() {
    const username = this.data.usernameDraft.trim();
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }

    this.setData({ savingUsername: true });
    try {
      let userInfo = this.data.userInfo || {};
      const res = await api.updateUserProfile({ username, displayName: username });
      userInfo = res.user || { ...userInfo, username, displayName: username };

      wx.setStorageSync('userInfo', userInfo);
      this.updateCachedGroupMember(userInfo);
      app.globalData.userInfo = userInfo;
      this.setData({
        userInfo,
        editingUsername: false,
        usernameDraft: username,
        avatarLetter: username ? username[0].toUpperCase() : '?'
      });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      const message = err && (err.message || err.error);
      wx.showToast({ title: message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ savingUsername: false });
    }
  },

  updateCachedGroupMember(userInfo) {
    const uid = userInfo.uid;
    if (!uid) return;

    const groups = (wx.getStorageSync('groups') || []).map(group => ({
      ...group,
      members: (group.members || []).map(member => (
        member.uid === uid ? { ...member, username: userInfo.username, displayName: userInfo.displayName, photoUrl: userInfo.photoUrl } : member
      ))
    }));

    wx.setStorageSync('groups', groups);
    this.setData({ groups: this.buildDisplayGroups(groups, userInfo) });
  },

  selectGroup(e) {
    if (this.data.groups.length <= 1) return;

    const groupId = e.currentTarget.dataset.id;
    if (groupId === this.data.currentGroupId) return;

    const groups = this.data.groups;
    const selectedGroup = groups.find(g => g.id === groupId);
    if (selectedGroup) {
      const sortedGroups = [selectedGroup, ...groups.filter(g => g.id !== groupId)];
      wx.setStorageSync('groups', sortedGroups);
      this.setData({ groups: sortedGroups, currentGroupId: groupId });
      wx.showToast({ title: '已切换群组', icon: 'success' });
    }
  },

  copyCode(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) {
      wx.showToast({ title: '邀请码不存在', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  goToGroupManage(e) {
    const groupId = e.currentTarget.dataset.id;
    if (!groupId) return;
    wx.navigateTo({ url: `/pages/group-manage/group-manage?id=${groupId}` });
  },

  showAddGroup() {
    if (this.data.groups.length >= MAX_GROUP_COUNT) {
      wx.showToast({ title: '最多只能加入5个群组', icon: 'none' });
      return;
    }

    wx.showActionSheet({
      itemList: ['加入新群组', '创建新群组'],
      success: (res) => {
        if (res.tapIndex === 0) this.promptJoinGroup();
        if (res.tapIndex === 1) this.promptCreateGroup();
      }
    });
  },

  promptJoinGroup() {
    wx.showModal({
      title: '加入新群组',
      editable: true,
      placeholderText: '输入6位邀请码',
      success: async (res) => {
        if (res.confirm && res.content) {
          await this.joinGroup(res.content.trim());
        }
      }
    });
  },

  promptCreateGroup() {
    wx.showModal({
      title: '创建新群组',
      editable: true,
      placeholderText: '输入群组名称',
      success: async (res) => {
        if (res.confirm && res.content) {
          await this.createGroup(res.content.trim());
        }
      }
    });
  },

  async joinGroup(inviteCode) {
    if (!inviteCode || inviteCode.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '加入中...' });
      const res = await api.joinGroup(inviteCode);
      const groups = this.mergeGroup(res.group);
      if (!groups) return;
      wx.setStorageSync('groups', groups);
      app.globalData.currentGroup = groups[0];
      this.setData({ groups: this.buildDisplayGroups(groups, this.data.userInfo || {}), currentGroupId: groups[0].id });
      wx.showToast({ title: '加入成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: err.error || '加入失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async createGroup(groupName) {
    if (!groupName) {
      wx.showToast({ title: '请输入群组名称', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '创建中...' });
      const res = await api.createGroup(groupName);
      const groups = this.mergeGroup(res.group);
      if (!groups) return;
      wx.setStorageSync('groups', groups);
      app.globalData.currentGroup = groups[0];
      this.setData({ groups: this.buildDisplayGroups(groups, this.data.userInfo || {}), currentGroupId: groups[0].id });
      wx.showModal({
        title: '创建成功',
        content: `邀请码：${res.group.inviteCode}`,
        confirmText: '复制',
        success: (modalRes) => {
          if (modalRes.confirm) this.copyInviteCode(res.group.inviteCode);
        }
      });
    } catch (err) {
      wx.showToast({ title: err.error || '创建失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  mergeGroup(group) {
    if (!group) return this.data.groups;

    const exists = this.data.groups.some(item => item.id === group.id);
    if (exists) {
      wx.showToast({ title: '已在该群组中', icon: 'none' });
      return null;
    }

    return [group, ...this.data.groups].slice(0, MAX_GROUP_COUNT);
  },

  copyInviteCode(code) {
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('groups');
          wx.reLaunch({ url: '/pages/auth/auth' });
        }
      }
    });
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({ url: '/pages/camera/camera' });
  }
});
