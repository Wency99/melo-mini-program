const app = getApp();
const api = require('../../services/api.js');
const { getHourMark } = require('../../utils/util.js');

Page({
  data: {
    photo: '',
    city: '',
    caption: '',
    hourMark: '',
    frameHeight: 0,
    frameTop: 0,
    nav: app.getNavBarStyle(),
    publishing: false,
    publishStatus: '',
    published: false
  },

  onLoad(query) {
    const info = wx.getSystemInfoSync();
    const frameHeight = Number(decodeURIComponent(query.frameHeight || '')) || info.windowWidth;
    const frameTop = Number(decodeURIComponent(query.frameTop || '')) || Math.max(0, Math.round((info.windowHeight - frameHeight) / 2));

    this.setData({
      photo: decodeURIComponent(query.photo),
      city: decodeURIComponent(query.city),
      hourMark: getHourMark(),
      time: query.time ? decodeURIComponent(query.time) : getHourMark(),
      frameHeight,
      frameTop,
      nav: app.getNavBarStyle()
    });
  },

  onShow() {
    this.setData({ nav: app.getNavBarStyle() });
    // 发布后不允许返回到编辑页
    if (this.data.published) {
      wx.redirectTo({ url: '/pages/space/space' });
    }
  },

  onCaptionInput(e) { this.setData({ caption: e.detail.value }); },
  onCancel() {
    // 发布前可以返回
    if (!this.data.published) {
      wx.navigateBack();
    }
  },

  async handlePublish() {
    if (this.data.publishing) return;
    const groups = wx.getStorageSync('groups') || [];
    const currentGroup = groups[0];
    if (!currentGroup) { wx.showToast({ title: '请先加入群组', icon: 'none' }); return; }

    this.setData({ publishing: true, publishStatus: '准备中...' });
    let shouldKeepLoading = false;
    try {
      const imagePath = await this.getPublishImageUrl(this.data.photo);

      await api.createPost(
        currentGroup.id,
        imagePath,
        this.data.caption,
        this.data.city,
        this.data.hourMark
      );
      this.setData({ published: true, publishStatus: '完成' });
      shouldKeepLoading = true;
      wx.redirectTo({ url: '/pages/space/space' });
    } catch (err) {
      console.error('Publish failed', err);
      const msg = (err && (err.error || err.message)) || '发布失败';
      if (typeof msg === 'string' && msg.includes('的共享时刻已开始')) {
        wx.showModal({
          title: '提示',
          content: msg,
          showCancel: false,
          confirmText: '知道了',
          success: () => wx.redirectTo({ url: '/pages/space/space' })
        });
      } else {
        wx.showToast({ title: '发布失败', icon: 'none' });
      }
    } finally {
      if (!shouldKeepLoading) {
        this.setData({ publishing: false });
      }
    }
  },

  async getPublishImageUrl(filePath) {
    if (filePath.startsWith('data:image')) {
      return filePath;
    }

    const compressedPath = await this.compressImage(filePath);
    const base64 = await this.readFileAsBase64(compressedPath);
    return `data:image/jpeg;base64,${base64}`;
  },

  compressImage(filePath) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: filePath,
        quality: 72,
        success: (res) => resolve(res.tempFilePath || filePath),
        fail: () => resolve(filePath)
      });
    });
  },

  readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (res) => resolve(res.data),
        fail: reject
      });
    });
  }
});
