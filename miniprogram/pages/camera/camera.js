const api = require('../../services/api.js');
const { getHourMark } = require('../../utils/util.js');

const spaceIcon = 'data:image/svg+xml;base64,PHN2ZyB0PSIxNzc4OTM4MzExODI3IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEzMDM2IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTUyNy41NTIgMjUyLjg5NmEyNzIgMjcyIDAgMSAwIDAgNTQ0IDI3MiAyNzIgMCAwIDAgMC01NDR6IG0tMzM2IDI3MmMwLTE4NS42IDE1MC40LTMzNiAzMzYtMzM2IDE4NS41NjggMCAzMzYgMTUwLjQgMzM2IDMzNiAwIDE4NS41NjgtMTUwLjQzMiAzMzYtMzM2IDMzNi0xODUuNiAwLTMzNi0xNTAuNDMyLTMzNi0zMzZ6IiBmaWxsPSIjZmZmZmZmIiBwLWlkPSIxMzAzNyI+PC9wYXRoPjxwYXRoIGQ9Ik01MjEuNTA0IDMxMS41ODRhMzIgMzIgMCAwIDEgMzYuODY0LTI2LjI0YzY2LjcyIDExLjIgMTIzLjUyIDQ2LjAxNiAxNjAuODY0IDkzLjkyYTMyIDMyIDAgMCAxLTUwLjQ2NCAzOS4zNmMtMjcuMzI4LTM1LjA0LTY5Ljc5Mi02MS42LTEyMC45Ni03MC4xNzZhMzIgMzIgMCAwIDEtMjYuMzA0LTM2Ljg2NHoiIGZpbGw9IiNmZmZmZmYiIHAtaWQ9IjEzMDM4Ij48L3BhdGg+PHBhdGggZD0iTTIzMS41ODQgNTIzLjIzMmEzMiAzMiAwIDAgMS0xLjA4OCA0NS4yNDhjLTM2LjM4NCAzNC42NTYtNjEuNzYgNjYuNC03NS40MjQgOTIuNDgtMTQuMzM2IDI3LjM5Mi0xMi4xMjggNDAuODMyLTkuMjQ4IDQ2LjAxNiAyLjUyOCA0LjUxMiAxMC40OTYgMTIuMDk2IDM0LjI0IDE1LjQ4OCAyMy4wNzIgMy4yNjQgNTUuMiAxLjUwNCA5NC45NzYtNi40IDc5LjItMTUuODA4IDE4MS40NC01NC41NiAyODcuMjMyLTExMy4yNDhhMzIgMzIgMCAwIDEgMzEuMDQgNTUuOTY4Yy0xMDkuOTIgNjAuOTkyLTIxOC40NjQgMTAyLjYyNC0zMDUuNzYgMTIwLTQzLjQ1NiA4LjY3Mi04My40NTYgMTEuNzEyLTExNi40OCA3LjA0LTMyLjQxNi00LjYwOC02NC41NDQtMTcuNzkyLTgxLjE4NC00Ny44MDgtMTguODgtMzMuOTUyLTkuMDU2LTczLjI0OCA4LjQ4LTEwNi43MiAxOC4xNzYtMzQuNzUyIDQ4Ljk2LTcyIDg4LTEwOS4xNTJhMzIgMzIgMCAwIDEgNDUuMjE2IDEuMDg4ek02ODAuNjQgMjc2Ljg5NmEzMiAzMiAwIDAgMSAyMy42MTYtMzguNjI0YzQ5LjQ0LTExLjg0IDk0Ljg4LTE3LjE4NCAxMzIuMDY0LTEzLjYzMiAzNi4wMzIgMy4zOTIgNzIuNTQ0IDE2LjEyOCA5MC43MiA0OC44OTYgMTMuMTUyIDIzLjcxMiAxMi4xOTIgNTAuMzA0IDQuODY0IDc0LjY4OC03LjMyOCAyNC4yODgtMjEuNzYgNDkuNDA4LTQwLjU0NCA3NC4yNC0zNy42OTYgNDkuODU2LTk3LjE4NCAxMDQuMjU2LTE3MC4zMDQgMTU2LjE2YTMyIDMyIDAgMSAxLTM3LjA4OC01Mi4xNmM3MC4wMTYtNDkuNzI4IDEyMy45MzYtOTkuNzQ0IDE1Ni4zMi0xNDIuNTkyIDE2LjI1Ni0yMS40NzIgMjYuMDE2LTM5Ljc0NCAzMC4zMzYtNTQuMTEyIDQuMjg4LTE0LjI3MiAyLjQzMi0yMS41NjggMC40NDgtMjUuMTg0LTIuNzUyLTQuOTYtMTIuMjU2LTEzLjUzNi00MC44LTE2LjIyNC0yNy4zOTItMi42MjQtNjUuMTUyIDEuMTItMTExLjA0IDEyLjE2YTMyIDMyIDAgMCAxLTM4LjU5Mi0yMy42MTZ6IiBmaWxsPSIjZmZmZmZmIiBwLWlkPSIxMzAzOSI+PC9wYXRoPjwvc3ZnPg==';
const profileIcon = 'data:image/svg+xml;base64,PHN2ZyB0PSIxNzc4OTM4MjY3NjgwIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjEyMjk2IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTYxNC40IDUzMi40OGMxODAuOTgxNzYgMCAzMjcuNjggMTQ2LjY5ODI0IDMyNy42OCAzMjcuNjh2MjAuNDhhODEuOTIgODEuOTIgMCAwIDEtODEuOTIgODEuOTJIMTYzLjg0YTgxLjkyIDgxLjkyIDAgMCAxLTgxLjkyLTgxLjkydi0yMC40OGMwLTE4MC45ODE3NiAxNDYuNjk4MjQtMzI3LjY4IDMyNy42OC0zMjcuNjhoMjA0Ljh6IG0wIDYxLjQ0SDQwOS42Yy0xNDQuOTM2OTYgMC0yNjIuODE5ODQgMTE1LjgxNDQtMjY2LjE1ODA4IDI1OS45NTI2NEwxNDMuMzYgODYwLjE2djIwLjQ4YTIwLjQ4IDIwLjQ4IDAgMCAwIDE4LjA4Mzg0IDIwLjMzNjY0TDE2My44NCA5MDEuMTJoNjk2LjMyYTIwLjQ4IDIwLjQ4IDAgMCAwIDIwLjMzNjY0LTE4LjA4Mzg0TDg4MC42NCA4ODAuNjR2LTIwLjQ4YzAtMTQ0LjkzNjk2LTExNS44MTQ0LTI2Mi44MTk4NC0yNTkuOTUyNjQtMjY2LjE1ODA4TDYxNC40IDU5My45MnpNNTEyIDYxLjQ0YzExMy4xMTEwNCAwIDIwNC44IDkxLjY4ODk2IDIwNC44IDIwNC44cy05MS42ODg5NiAyMDQuOC0yMDQuOCAyMDQuOC0yMDQuOC05MS42ODg5Ni0yMDQuOC0yMDQuOFMzOTguODg4OTYgNjEuNDQgNTEyIDYxLjQ0eiBtMCA2MS40NGExNDMuMzYgMTQzLjM2IDAgMSAwIDAgMjg2LjcyIDE0My4zNiAxNDMuMzYgMCAwIDAgMC0yODYuNzJ6IiBmaWxsPSIjZmZmZmZmIiBwLWlkPSIxMjI5NyI+PC9wYXRoPjwvc3ZnPg==';
const switchIcon = 'data:image/svg+xml;base64,PHN2ZyB0PSIxNzc4OTM3NzYyMjczIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjExMTU5IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHBhdGggZD0iTTc5MS42MTYgMjU2LjM0MTMzM2gxMDQuNDQ4YTg1LjY3NDY2NyA4NS42NzQ2NjcgMCAwIDEgODUuNTY4IDg1LjI2OTMzNGwxLjcwNjY2NyA0NjkuMTJhODQuNjUwNjY3IDg0LjY1MDY2NyAwIDAgMS04NS4wNzczMzQgODUuMDU2bC03NjcuOTM2LTEuODEzMzM0YTg1Ljk3MzMzMyA4NS45NzMzMzMgMCAwIDEtODUuNjc0NjY2LTg1LjUwNGwtMS42ODUzMzQtNDY2LjgxNmE4NC45MjggODQuOTI4IDAgMCAxIDg0Ljk5Mi04NS4zMTJoMTMwLjQxMDY2N2MxMS44NjEzMzMgMCAyNS43OTItOC42MTg2NjcgMzEuMTI1MzMzLTE5LjIyMTMzM2wzNC44NTg2NjctNjkuMzc2YzEwLjQ5Ni0yMC45MDY2NjcgMzguMTQ0LTM4LjA4IDYxLjY3NDY2Ny0zOC4xODY2NjdsMjc2LjkyOC0xLjM0NGMyMy42MzczMzMtMC4xMjggNTEuMiAxNi44NTMzMzMgNjEuODI0IDM3Ljk1MmwzNS45MDQgNzEuMjUzMzM0YzUuMjkwNjY3IDEwLjQ5NiAxOS4xMTQ2NjcgMTguOTIyNjY3IDMwLjkzMzMzMyAxOC45MjI2NjZ6IG0wIDQyLjY2NjY2N2MtMjcuODgyNjY3IDAtNTYuNDY5MzMzLTE3LjQ3Mi02OS4wMzQ2NjctNDIuNDEwNjY3bC0zNS45MDQtNzEuMjUzMzMzYy0zLjM0OTMzMy02LjY1Ni0xNi4xMjgtMTQuNTA2NjY3LTIzLjUwOTMzMy0xNC40NjRsLTI3Ni45MDY2NjcgMS4zNDRjLTcuNDY2NjY3IDAuMDIxMzMzLTIwLjQ4IDguMTA2NjY3LTIzLjc4NjY2NiAxNC42NzczMzNsLTM0Ljg1ODY2NyA2OS4zNzZjLTEyLjU4NjY2NyAyNS4wMjQtNDEuMjM3MzMzIDQyLjczMDY2Ny02OS4yNDggNDIuNzMwNjY3SDEyNy45NTczMzNjLTIzLjQ2NjY2NyAwLTQyLjQxMDY2NyAxOC45ODY2NjctNDIuMzI1MzMzIDQyLjQ3NDY2N2wxLjcwNjY2NyA0NjYuODM3MzMzYTQzLjMwNjY2NyA0My4zMDY2NjcgMCAwIDAgNDMuMDkzMzMzIDQyLjk4NjY2N2w3NjcuOTE0NjY3IDEuODEzMzMzYTQxLjk4NCA0MS45ODQgMCAwIDAgNDIuMzA0LTQyLjI0bC0xLjY4NTMzNC00NjkuMTJhNDMuMDA4IDQzLjAwOCAwIDAgMC00Mi44OC00Mi43NTJoLTEwNC40NjkzMzN6IG0tMzQxLjIwNTMzMyA1Mi40MTZhMTkyLjA4NTMzMyAxOTIuMDg1MzMzIDAgMCAwLTUzLjIwNTMzNCAzMzUuODI5MzMzIDIxLjMzMzMzMyAyMS4zMzMzMzMgMCAwIDEtMjUuNTM2IDM0LjE5NzMzNEEyMzQuMzA0IDIzNC4zMDQgMCAwIDEgMjc3LjMzMzMzMyA1MzMuMzMzMzMzYzAtMTEzLjU1NzMzMyA4MC42ODI2NjctMjA4LjI5ODY2NyAxODcuODQtMjI5Ljk3MzMzM2wtMzIuMjU2LTMyLjI3NzMzM2EyMS4zMzMzMzMgMjEuMzMzMzMzIDAgMCAxIDMwLjE2NTMzNC0zMC4xNjUzMzRMNTQyLjE2NTMzMyAzMjBsLTc5LjA4MjY2NiA3OS4wODI2NjdhMjEuMzMzMzMzIDIxLjMzMzMzMyAwIDAgMS0zMC4xNjUzMzQtMzAuMTY1MzM0bDE3LjQ5MzMzNC0xNy40OTMzMzN6IG03MC42MzQ2NjYgMzczLjY5NmExOTIgMTkyIDAgMCAwIDY4Ljc3ODY2Ny0zNjcuMzYgMjEuMzMzMzMzIDIxLjMzMzMzMyAwIDEgMSAxNy4zMDEzMzMtMzguOTk3MzMzQTIzNC42NjY2NjcgMjM0LjY2NjY2NyAwIDAgMSA3NDYuNjY2NjY3IDUzMy4zMzMzMzNjMCAxMjYuNjk4NjY3LTEwMC40MTYgMjI5Ljk1Mi0yMjUuOTg0IDIzNC41MTczMzRsMjcuNzMzMzMzIDI3LjczMzMzM2EyMS4zMzMzMzMgMjEuMzMzMzMzIDAgMCAxLTMwLjE2NTMzMyAzMC4xNjUzMzNMNDM5LjE2OCA3NDYuNjY2NjY3bDc5LjA4MjY2Ny03OS4wODI2NjdhMjEuMzMzMzMzIDIxLjMzMzMzMyAwIDAgMSAzMC4xNjUzMzMgMzAuMTY1MzMzbC0yNy4zNzA2NjcgMjcuMzcwNjY3eiIgZmlsbD0iI0ZGRkZGRiIgcC1pZD0iMTExNjAiPjwvcGF0aD48L3N2Zz4=';

Page({
  data: {
    cameraPosition: 'back',
    cameraVisible: true,
    switchingCamera: false,
    currentTime: '',
    city: '',
    activeControl: '',
    frameHeight: 320,
    frameTop: 160,
    canParticipate: true,
    sessionLocked: false,
    hasPublished: false,
    statusTitle: '',
    statusHint: '',
    spaceIcon,
    profileIcon,
    switchIcon
  },

  onLoad() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
    this.setCityFromProfile();
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

  setCityFromProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const city = userInfo.city || '未设置城市';
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
