const api = require('../../services/api.js');

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    currentCity: {
      type: String,
      value: ''
    }
  },

  data: {
    query: '',
    cities: [],
    popularCities: [],
    searching: false,
    searchTimer: null
  },

  observers: {
    'visible': function (val) {
      if (val) {
        this.setData({ query: '', cities: [] });
        this.loadPopularCities();
      }
    }
  },

  methods: {
    async loadPopularCities() {
      try {
        const cities = await api.searchCities('');
        this.setData({ popularCities: cities || [] });
      } catch (err) {
        console.warn('Failed to load popular cities', err);
        this.setData({ popularCities: [] });
      }
    },

    onInput(e) {
      const query = e.detail.value;
      this.setData({ query });
      if (this.data.searchTimer) clearTimeout(this.data.searchTimer);
      if (!query.trim()) {
        this.setData({ cities: [] });
        return;
      }
      this.data.searchTimer = setTimeout(() => this.search(query.trim()), 300);
    },

    async search(query) {
      this.setData({ searching: true });
      try {
        const cities = await api.searchCities(query);
        this.setData({ cities: cities || [] });
      } catch (err) {
        console.warn('City search failed', err);
        wx.showToast({ title: '搜索失败', icon: 'none' });
      } finally {
        this.setData({ searching: false });
      }
    },

    onSelectCity(e) {
      const city = e.currentTarget.dataset.city;
      if (!city) return;
      this.triggerEvent('select', { city });
    },

    onClose() {
      this.triggerEvent('close');
    },

    onMaskTap() {
      this.triggerEvent('close');
    },

    onContainerTap() {
      // Stop propagation to prevent mask-tap closing
    }
  }
});
