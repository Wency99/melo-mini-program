const api = require('../../services/api.js');
const { getLocation, getHourMark } = require('../../utils/util.js');

Page({
  data: {
    cameraPosition: 'back',
    cameraVisible: true,
    switchingCamera: false,
    currentTime: '',
    city: '定位中...',
    activeControl: '',
    frameHeight: 320,
    frameTop: 160,
    canParticipate: true,
    sessionLocked: false,
    hasPublished: false,
    statusTitle: '',
    statusHint: ''
  },

  onLoad() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
    this.initLocation();
    this.refreshCaptureState();
  },

  onShow() {
    this.refreshCaptureState();
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
    if (this.cameraSwitchTimer) clearTimeout(this.cameraSwitchTimer);
  },

  updateTime() {
    const d = new Date();
    const currentTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    this.setData({ currentTime });
  },

  async refreshCaptureState() {
    const groups = wx.getStorageSync('groups') || [];
    const currentGroup = groups[0] || {};
    const userInfo = wx.getStorageSync('userInfo') || {};
    let captureGroup = currentGroup;
    let memberCount = this.getMemberCount(currentGroup);
    const hourMark = getHourMark();

    let hasPublished = false;
    let sessionLocked = false;

    if (currentGroup.id) {
      try {
        const res = await api.getGroupPosts(currentGroup.id);
        const currentPosts = (res.posts || []).filter(post => post.hourMark === hourMark);
        hasPublished = currentPosts.some(post => post.userId === userInfo.uid);
        sessionLocked = this.isCurrentUserLocked(currentGroup, userInfo, currentPosts);
        captureGroup = this.getCaptureGroupForSession(currentGroup, currentPosts);
        memberCount = this.getMemberCount(captureGroup);
      } catch (err) {
        console.warn('Failed to refresh capture state', err);
      }
    }

    const canParticipate = !!currentGroup.id && !sessionLocked;
    const status = this.getStatusCopy(currentGroup, sessionLocked, hasPublished);

    this.setData(Object.assign({ canParticipate, sessionLocked, hasPublished }, status));
    this.updateFrameLayout(memberCount, captureGroup, userInfo);
  },

  getMemberCount(group) {
    const members = group.members || [];
    const memberUids = group.memberUids || [];
    return Math.max(1, members.length || memberUids.length || 1);
  },

  getUserSlotIndex(group, userInfo) {
    const members = group.members || [];
    if (members.length && userInfo.uid) {
      const index = members.findIndex(member => member.uid === userInfo.uid);
      if (index >= 0) return index;
    }

    const memberUids = group.memberUids || [];
    if (memberUids.length && userInfo.uid) {
      const index = memberUids.indexOf(userInfo.uid);
      if (index >= 0) return index;
    }

    return 0;
  },

  getCurrentMember(group, userInfo) {
    const members = group.members || [];
    if (members.length && userInfo.uid) {
      return members.find(member => member.uid === userInfo.uid) || null;
    }

    const memberUids = group.memberUids || [];
    if (memberUids.length && userInfo.uid && memberUids.indexOf(userInfo.uid) >= 0) {
      return { uid: userInfo.uid };
    }

    return null;
  },

  isCurrentUserLocked(group, userInfo, currentPosts) {
    if (!currentPosts || currentPosts.length === 0) return false;
    if (currentPosts.some(post => post.userId === userInfo.uid)) return false;

    const currentMember = this.getCurrentMember(group, userInfo);
    if (!currentMember) return true;
    if (!currentMember.joinedAt) return false;

    const joinedAt = new Date(currentMember.joinedAt).getTime();
    const firstPostAt = this.getFirstPostAt(currentPosts);

    if (!Number.isFinite(joinedAt) || !Number.isFinite(firstPostAt)) return false;

    return joinedAt > firstPostAt;
  },

  getCaptureGroupForSession(group, currentPosts) {
    if (!currentPosts || currentPosts.length === 0) return group;

    const firstPostAt = this.getFirstPostAt(currentPosts);
    if (!Number.isFinite(firstPostAt)) return group;

    const postUserIds = new Set(currentPosts.map(post => post.userId));
    const members = (group.members || []).filter(member => {
      if (postUserIds.has(member.uid)) return true;
      if (!member.joinedAt && !member.joined_at) return true;

      const joinedAt = new Date(member.joinedAt || member.joined_at).getTime();
      if (!Number.isFinite(joinedAt)) return true;
      return joinedAt <= firstPostAt;
    });

    if (members.length === 0) return group;

    return {
      ...group,
      members,
      memberUids: members.map(member => member.uid)
    };
  },

  getFirstPostAt(currentPosts) {
    return currentPosts.reduce((earliest, post) => {
      const createdAt = new Date(post.createdAt || post.created_at).getTime();
      return Number.isFinite(createdAt) ? Math.min(earliest, createdAt) : earliest;
    }, Number.POSITIVE_INFINITY);
  },

  getStatusCopy(group, sessionLocked) {
    if (!group || !group.id) {
      return {
        statusTitle: '先加入一个群组',
        statusHint: '创建或加入群组后开始记录'
      };
    }

    if (sessionLocked) {
      return {
        statusTitle: '这一轮已经开始记录啦',
        statusHint: '下一轮再一起加入'
      };
    }

    return {
      statusTitle: '',
      statusHint: ''
    };
  },

  updateFrameLayout(memberCount, group, userInfo) {
    const info = wx.getSystemInfoSync();
    const windowWidth = info.windowWidth;
    const windowHeight = info.windowHeight;
    const slotIndex = this.getUserSlotIndex(group || {}, userInfo || {});
    const slot = this.getSlotSize(memberCount, slotIndex);
    const slotWidth = windowWidth * slot.width;
    const slotHeight = windowHeight * slot.height;
    const desiredHeight = Math.round(windowWidth * slotHeight / slotWidth);
    const frameHeight = Math.min(desiredHeight, windowHeight);
    const frameTop = Math.round((windowHeight - frameHeight) / 2);

    this.setData({
      frameHeight,
      frameTop
    });
  },

  getSlotSize(memberCount, slotIndex) {
    if (memberCount <= 1) return { width: 1, height: 1 };
    if (memberCount === 2) return { width: 1, height: 0.5 };
    if (memberCount === 3) return { width: 1, height: 1 / 3 };
    if (memberCount === 4) return { width: 0.5, height: 0.5 };
    return { width: 0.5, height: 0.5 };
  },

  async initLocation() {
    const setting = await new Promise((resolve) => {
      wx.getSetting({
        success: (res) => resolve(res),
        fail: () => resolve({ authSetting: {} })
      });
    });

    if (!setting.authSetting['scope.userLocation']) {
      const result = await new Promise((resolve) => {
        wx.authorize({
          scope: 'scope.userLocation',
          success: () => resolve(true),
          fail: () => resolve(false)
        });
      });

      if (!result) {
        wx.showToast({ title: '定位权限被拒绝', icon: 'none', duration: 2000 });
        this.setData({ city: '未知位置' });
        return;
      }
    }

    const city = await getLocation();
    this.setData({ city });
  },

  switchCamera() {
    if (this.data.switchingCamera || !this.data.canParticipate) return;

    const cameraPosition = this.data.cameraPosition === 'back' ? 'front' : 'back';
    this.setData({ cameraVisible: false, switchingCamera: true });

    setTimeout(() => {
      this.setData({ cameraPosition, cameraVisible: true });
      this.cameraSwitchTimer = setTimeout(() => {
        this.setData({ switchingCamera: false });
      }, 1000);
    }, 150);
  },

  onCameraInit() {
    if (this.cameraSwitchTimer) {
      clearTimeout(this.cameraSwitchTimer);
      this.cameraSwitchTimer = null;
    }

    this.setData({ switchingCamera: false });
  },

  onCameraError(err) {
    if (this.cameraSwitchTimer) {
      clearTimeout(this.cameraSwitchTimer);
      this.cameraSwitchTimer = null;
    }

    this.setData({ switchingCamera: false, cameraVisible: true });
    console.error('Camera error', err);
    wx.showToast({ title: '相机不可用', icon: 'none' });
  },

  capturePhoto() {
    if (!this.data.cameraVisible || this.data.switchingCamera || !this.data.canParticipate) return;

    const cameraContext = wx.createCameraContext(`camera-${this.data.cameraPosition}`);
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => this.goToPreview(res.tempImagePath),
      fail: () => wx.showToast({ title: '拍照失败', icon: 'none' })
    });
  },

  goToPreview(photoPath) {
    const path = encodeURIComponent(photoPath);
    const city = encodeURIComponent(this.data.city);
    const time = encodeURIComponent(this.data.currentTime);
    const frameHeight = encodeURIComponent(this.data.frameHeight);
    const frameTop = encodeURIComponent(this.data.frameTop);
    wx.navigateTo({ url: `/pages/preview/preview?photo=${path}&city=${city}&time=${time}&frameHeight=${frameHeight}&frameTop=${frameTop}` });
  },

  pressControl(e) {
    this.setData({ activeControl: e.currentTarget.dataset.key });
  },

  releaseControl() {
    this.setData({ activeControl: '' });
  },

  goToSpace() { wx.navigateTo({ url: '/pages/space/space' }); },
  goToProfile() { wx.navigateTo({ url: '/pages/profile/profile' }); }
});
