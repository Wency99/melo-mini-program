const api = require('../../services/api.js');
const { formatTime } = require('../../utils/util.js');
const app = getApp();

const DEFAULT_GROUP_AVATARS = [
  '/images/avatars/puzzle-1.png',
  '/images/avatars/puzzle-2.png',
  '/images/avatars/puzzle-3.png',
  '/images/avatars/puzzle-4.png'
];
const PINYIN_BOUNDARIES = '阿八嚓咑妸发旮哈讥咔垃嘸拏噢妑七呥仨他屲夕丫帀';

Page({
  data: { loading: true, entries: [], currentIndex: 0, memberCount: 2, nav: app.getNavBarStyle(), scrollLeft: 0, lastScrollLeft: 0, touchStartLeft: 0, touchStartX: 0, touchStartIndex: 0, timelineScrollLeft: 0 },
  scrollContext: null,

  onLoad() {
    this.setData({ nav: app.getNavBarStyle() });
    this.loadData();
  },
  onShow() {
    this.setData({ nav: app.getNavBarStyle() });
    this.loadData();
  },
  onReady() {
    this.createSelectorQuery()
      .select('.scroll-view')
      .node()
      .exec((res) => {
        if (res[0] && res[0].node) {
          this.scrollContext = res[0].node;
          this.scrollToCurrent();
        }
      });
  },
  onUnload() {
    if (this.snapTimer) clearTimeout(this.snapTimer);
    if (this.timelineCenterTimer) clearTimeout(this.timelineCenterTimer);
  },

  scrollToPage(index, animated) {
    const width = wx.getSystemInfoSync().windowWidth;
    const scrollLeft = index * width;
    this.setData({ scrollLeft, lastScrollLeft: scrollLeft });
    if (this.scrollContext) {
      this.scrollContext.scrollTo({ left: scrollLeft, animated: !!animated });
    }
  },

  scrollToCurrent() {
    if (this.data.entries.length > 0) {
      wx.nextTick(() => {
        this.scrollToPage(this.data.currentIndex, false);
        this.centerTimeline(this.data.currentIndex);
      });
    }
  },

  centerTimeline(index) {
    if (this.timelineCenterTimer) clearTimeout(this.timelineCenterTimer);
    wx.nextTick(() => this.measureTimelineCenter(index));
    this.timelineCenterTimer = setTimeout(() => this.measureTimelineCenter(index), 260);
  },

  measureTimelineCenter(index) {
    this.createSelectorQuery()
      .select('.time-picker')
      .boundingClientRect()
      .select('.time-dots')
      .boundingClientRect()
      .select(`#time-dot-${index}`)
      .boundingClientRect()
      .exec((res) => {
        const pickerRect = res && res[0];
        const dotsRect = res && res[1];
        const dotRect = res && res[2];
        if (!pickerRect || !dotsRect || !dotRect) return;

        const dotCenterInContent = dotRect.left - dotsRect.left + dotRect.width / 2;
        const nextLeft = Math.max(0, Math.round(dotCenterInContent - pickerRect.width / 2));
        this.setData({ timelineScrollLeft: nextLeft });
      });
  },

  async loadData() {
    const groups = await this.getFreshGroups();
    if (groups.length === 0) { this.setData({ loading: false }); return; }

    const currentGroup = groups[0];
    const members = currentGroup.members || [];
    this.setData({ memberCount: members.length });

    try {
      const res = await api.getGroupPosts(currentGroup.id);
      const entries = await this.processPosts(res.posts || [], members);
      const currentIndex = Math.min(this.data.currentIndex, Math.max(entries.length - 1, 0));
      this.setData({ entries, loading: false, currentIndex }, () => {
        this.scrollToCurrent();
      });
    } catch (err) {
      console.error('Failed to load posts', err);
      this.setData({ loading: false });
    }
  },

  async getFreshGroups() {
    const cachedGroups = wx.getStorageSync('groups') || [];
    try {
      const res = await api.getGroups();
      const groups = res.groups || cachedGroups;
      wx.setStorageSync('groups', groups);
      return groups;
    } catch (err) {
      console.warn('Failed to refresh groups for timeline', err);
      return cachedGroups;
    }
  },

  async processPosts(posts, members) {
    if (!members || members.length === 0) return [];
    if (!posts) posts = [];

    const currentUser = wx.getStorageSync('userInfo') || {};
    const userId = currentUser.uid;
    const currentUserName = currentUser.displayName || currentUser.username || '未知';

    const postBySlot = {};
    for (const post of posts) {
      if (!post || !post.imageUrl) continue;
      const dateKey = this.getPostDateKey(post);
      const hourMark = post.hourMark || '未知时刻';
      const key = `${dateKey}|${hourMark}`;
      if (!postBySlot[key]) {
        postBySlot[key] = { dateKey, dateLabel: this.formatDateLabel(dateKey), hourMark, posts: {} };
      }
      postBySlot[key].posts[post.userId] = post;
    }

    const slotKeys = Object.keys(postBySlot).sort((a, b) => b.localeCompare(a));
    const entries = [];

    for (const slotKey of slotKeys) {
      const cellList = [];
      const slot = postBySlot[slotKey];
      const hourPosts = slot.posts;
      const lockedAt = this.getLockedAt(hourPosts);
      const slotMembers = this.buildDisplayMembers(this.getSlotMembers(members, hourPosts, lockedAt));

      for (const member of slotMembers) {
        const memberPost = hourPosts[member.uid];
        const isYou = member.uid === userId;
        const displayName = member.displayName || member.username || '未知';

        if (memberPost) {
          let displayImageUrl = memberPost.imageUrl;
          try {
            displayImageUrl = await this.getDisplayImageUrl(memberPost.imageUrl, memberPost.id);
          } catch (err) {
            console.warn('Failed to prepare post image', err);
          }
          if (!displayImageUrl) displayImageUrl = memberPost.imageUrl;

          cellList.push({
            userId: member.uid,
            userName: isYou ? currentUserName : displayName,
            posted: true,
            displayImageUrl,
            caption: memberPost.caption,
            cityName: memberPost.cityName || memberPost.city_name,
            time: formatTime(memberPost.createdAt || memberPost.created_at),
            isYou,
            avatarUrl: member.avatarUrl,
            avatarLetter: member.avatarLetter
          });
        } else {
          cellList.push({
            userId: member.uid,
            userName: displayName,
            posted: false,
            avatarUrl: member.avatarUrl,
            avatarLetter: member.avatarLetter
          });
        }
      }
      const previousEntry = entries[entries.length - 1];
      entries.push({
        entryKey: slotKey,
        hourMark: slot.hourMark,
        dateKey: slot.dateKey,
        dateLabel: slot.dateLabel,
        showDateSeparator: !!previousEntry && previousEntry.dateKey !== slot.dateKey,
        memberCount: Math.max(1, slotMembers.length),
        posts: cellList
      });
    }
    return entries;
  },

  getLockedAt(hourPosts) {
    return Object.keys(hourPosts || {}).reduce((earliest, userId) => {
      const post = hourPosts[userId];
      const createdAt = new Date(post.createdAt || post.created_at).getTime();
      return Number.isFinite(createdAt) ? Math.min(earliest, createdAt) : earliest;
    }, Number.POSITIVE_INFINITY);
  },

  getSlotMembers(members, hourPosts, lockedAt) {
    if (!members || members.length === 0) return [];
    if (!Number.isFinite(lockedAt)) return members;

    const postUserIds = new Set(Object.keys(hourPosts || {}));
    return members.filter(member => {
      if (postUserIds.has(member.uid)) return true;
      if (!member.joinedAt && !member.joined_at) return true;

      const joinedAt = new Date(member.joinedAt || member.joined_at).getTime();
      if (!Number.isFinite(joinedAt)) return true;
      return joinedAt <= lockedAt;
    });
  },

  buildDisplayMembers(members) {
    const usedAvatars = new Set();
    return (members || []).map((member, index) => {
      const name = member.displayName || member.username || '未知';
      const existingAvatar = member.avatarUrl || member.avatar_url || '';
      const avatarUrl = existingAvatar || this.getAvailableGroupAvatar(usedAvatars, index);
      if (avatarUrl) usedAvatars.add(avatarUrl);

      return {
        ...member,
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

    const code = first.charCodeAt(0);
    if (code >= 0x4e00 && code <= 0x9fff) {
      for (let i = PINYIN_BOUNDARIES.length - 1; i >= 0; i -= 1) {
        if (first.localeCompare(PINYIN_BOUNDARIES[i], 'zh-CN') >= 0) {
          return 'ABCDEFGHJKLMNPQRSTWXYZ'[i] || first;
        }
      }
    }

    return first.toUpperCase();
  },

  getPostDateKey(post) {
    const source = post.createdAt || post.created_at || Date.now();
    const d = new Date(source);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  formatDateLabel(dateKey) {
    return dateKey || '';
  },

  async getDisplayImageUrl(imageUrl, postId) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('local:')) {
      return decodeURIComponent(imageUrl.replace('local:', ''));
    }
    if (imageUrl.startsWith('data:image')) {
      return this.saveDataUrlToTempFile(imageUrl, postId);
    }

    return imageUrl;
  },

  onScroll(e) {
    if (!this.data.entries.length) return;

    const width = e.detail.scrollWidth / this.data.entries.length;
    const index = Math.round(e.detail.scrollLeft / width);
    const data = { lastScrollLeft: e.detail.scrollLeft };
    if (index !== this.data.currentIndex) data.currentIndex = index;
    this.setData(data, () => {
      if (index !== this.data.currentIndex) return;
      this.centerTimeline(index);
    });
  },

  onTouchStart(e) {
    if (this.snapTimer) clearTimeout(this.snapTimer);
    this.pendingDirection = 0;

    this.setData({
      touchStartLeft: this.data.lastScrollLeft,
      touchStartX: e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0,
      touchStartIndex: this.data.currentIndex
    });
  },

  onTouchEnd(e) {
    const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : this.data.touchStartX;
    const deltaX = this.data.touchStartX - endX;
    const threshold = Math.max(24, wx.getSystemInfoSync().windowWidth * 0.06);

    this.pendingDirection = Math.abs(deltaX) >= threshold ? (deltaX > 0 ? 1 : -1) : 0;
    this.snapTimer = setTimeout(() => this.snapToEntry(), 700);
  },

  snapToEntry() {
    if (!this.data.entries.length) return;
    if (this.snapTimer) {
      clearTimeout(this.snapTimer);
      this.snapTimer = null;
    }

    const width = wx.getSystemInfoSync().windowWidth;
    const maxIndex = this.data.entries.length - 1;
    let index = Math.round(this.data.lastScrollLeft / width);

    if (this.pendingDirection) {
      index = this.data.touchStartIndex + this.pendingDirection;
      this.pendingDirection = 0;
    }

    index = Math.max(0, Math.min(maxIndex, index));

    this.setData({ currentIndex: index }, () => this.centerTimeline(index));
    this.scrollToPage(index, true);
  },

  scrollToEntry(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ currentIndex: index }, () => this.centerTimeline(index));
    this.scrollToPage(index, true);
  },

  async handleDownload() {
    const entries = this.data.entries;
    if (!entries || entries.length === 0) { wx.showToast({ title: '没有可下载的照片', icon: 'none' }); return; }

    const currentEntry = entries[this.data.currentIndex];
    if (!currentEntry || !currentEntry.posts || currentEntry.posts.length === 0) {
      wx.showToast({ title: '没有可下载的照片', icon: 'none' }); return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const filePath = await this.renderEntryToImage(currentEntry);
      await this.saveImageToAlbum(filePath);
      wx.showToast({ title: '保存成功', icon: 'none' });
    } catch (err) {
      console.error('Download failed', err);
      const message = err && err.errMsg && err.errMsg.includes('auth deny') ? '请授权保存到相册' : '保存失败';
      wx.showToast({ title: message, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async renderEntryToImage(entry) {
    const canvasInfo = await this.getDownloadCanvas();
    const { canvas, ctx } = canvasInfo;
    const width = 1080;
    const height = 1920;
    const dpr = wx.getSystemInfoSync().pixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const posts = entry.posts || [];
    const memberCount = Math.max(1, Math.min(entry.memberCount || posts.length || 1, 4));
    const cells = this.getDownloadCells(memberCount, width, height);

    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const post = posts[i] || {};
      ctx.save();
      ctx.beginPath();
      ctx.rect(cell.x, cell.y, cell.w, cell.h);
      ctx.clip();

      if (post.posted && post.displayImageUrl) {
        const imagePath = await this.resolveImagePath(post.displayImageUrl, post.userId || i);
        const image = await this.loadCanvasImage(canvas, imagePath);
        this.drawCoverImage(ctx, image, cell.x, cell.y, cell.w, cell.h);
        this.drawPostInfo(ctx, post, cell);
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
        this.drawPlaceholder(ctx, post, cell);
      }
      ctx.restore();
    }

    this.drawEntryTime(ctx, entry, width, height);

    return this.canvasToTempFile(canvas, width, height);
  },

  getDownloadCanvas() {
    return new Promise((resolve, reject) => {
      this.createSelectorQuery()
        .select('#downloadCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res && res[0] && res[0].node;
          if (!canvas) {
            reject(new Error('Canvas not found'));
            return;
          }
          resolve({ canvas, ctx: canvas.getContext('2d') });
        });
    });
  },

  getDownloadCells(memberCount, width, height) {
    if (memberCount <= 1) return [{ x: 0, y: 0, w: width, h: height }];
    if (memberCount === 2) {
      return [
        { x: 0, y: 0, w: width, h: height / 2 },
        { x: 0, y: height / 2, w: width, h: height / 2 }
      ];
    }
    if (memberCount === 3) {
      return [
        { x: 0, y: 0, w: width, h: height / 3 },
        { x: 0, y: height / 3, w: width, h: height / 3 },
        { x: 0, y: height * 2 / 3, w: width, h: height / 3 }
      ];
    }
    return [
      { x: 0, y: 0, w: width / 2, h: height / 2 },
      { x: width / 2, y: 0, w: width / 2, h: height / 2 },
      { x: 0, y: height / 2, w: width / 2, h: height / 2 },
      { x: width / 2, y: height / 2, w: width / 2, h: height / 2 }
    ];
  },

  async resolveImagePath(imageUrl, fileKey) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const res = await this.downloadFile(imageUrl);
      return res.tempFilePath;
    }
    if (imageUrl.startsWith('local:')) {
      return decodeURIComponent(imageUrl.replace('local:', ''));
    }
    if (imageUrl.startsWith('data:image')) {
      return this.saveDataUrlToTempFile(imageUrl, fileKey);
    }
    return imageUrl;
  },

  downloadFile(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) resolve(res);
          else reject(new Error(`Download failed: ${res.statusCode}`));
        },
        fail: reject
      });
    });
  },

  loadCanvasImage(canvas, src) {
    return new Promise((resolve, reject) => {
      const image = canvas.createImage();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  },

  drawCoverImage(ctx, image, x, y, w, h) {
    const imageRatio = image.width / image.height;
    const cellRatio = w / h;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (imageRatio > cellRatio) {
      sw = image.height * cellRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width / cellRatio;
      sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  },

  drawEntryTime(ctx, entry, width, height) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.36)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
    ctx.font = '600 32px sans-serif';
    ctx.fillText(entry.dateLabel || '', width / 2, height / 2 - 62);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 84px sans-serif';
    ctx.fillText(entry.hourMark || '', width / 2, height / 2 + 36);
    ctx.restore();
  },

  drawPostInfo(ctx, post, cell) {
    const padding = 30;
    const x = cell.x + 44;
    const maxW = Math.min(430, cell.w - 88);
    const lines = [
      { text: post.caption || '', font: '700 32px sans-serif', color: '#3F3F3F', height: post.caption ? 42 : 0 },
      { text: post.userName || '', font: '600 26px sans-serif', color: '#787878', height: 34 },
      { text: this.getMetaText(post), font: '400 23px sans-serif', color: '#A8A8A8', height: 31 }
    ].filter(line => line.text);
    const boxH = lines.reduce((sum, line) => sum + line.height, 0) + padding * 2;
    const y = cell.y + cell.h - boxH - 44;

    this.drawRoundRect(ctx, x, y, maxW, boxH, 24, 'rgba(253, 253, 247, 0.88)');

    let textY = y + padding;
    for (const line of lines) {
      ctx.fillStyle = line.color;
      ctx.font = line.font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      this.drawSingleLineText(ctx, line.text, x + padding, textY, maxW - padding * 2);
      textY += line.height;
    }
  },

  getMetaText(post) {
    const parts = [];
    if (post.cityName) parts.push(`📍 ${post.cityName}`);
    if (post.time) parts.push(post.time);
    return parts.join(' | ');
  },

  drawPlaceholder(ctx, post, cell) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 30px sans-serif';
    ctx.fillText(post.userName || '未知', cell.x + cell.w / 2, cell.y + cell.h / 2 - 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '400 25px sans-serif';
    ctx.fillText('没发照片，在干嘛？', cell.x + cell.w / 2, cell.y + cell.h / 2 + 24);
  },

  drawRoundRect(ctx, x, y, w, h, r, color) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },

  drawSingleLineText(ctx, text, x, y, maxWidth) {
    const value = `${text || ''}`;
    if (ctx.measureText(value).width <= maxWidth) {
      ctx.fillText(value, x, y);
      return;
    }

    let next = value;
    while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
      next = next.slice(0, -1);
    }
    ctx.fillText(`${next}...`, x, y);
  },

  canvasToTempFile(canvas, width, height) {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        width,
        height,
        destWidth: width,
        destHeight: height,
        fileType: 'jpg',
        quality: 0.92,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      });
    });
  },

  saveImageToAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: reject
      });
    });
  },

  saveDataUrlToTempFile(dataUrl, fileKey) {
    return new Promise((resolve, reject) => {
      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+)(?:;[^,]*)?;base64,(.+)$/);
      if (!match) {
        reject(new Error('Invalid image data'));
        return;
      }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1].replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const safeKey = (fileKey || Date.now().toString()).replace(/[^a-zA-Z0-9_-]/g, '');
      const filePath = `${wx.env.USER_DATA_PATH}/melo-${safeKey}.${ext}`;
      wx.getFileSystemManager().writeFile({
        filePath,
        data: match[2],
        encoding: 'base64',
        success: () => resolve(filePath),
        fail: reject
      });
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
