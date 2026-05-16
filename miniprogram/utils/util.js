function formatTime(timestamp) {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getHourMark() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

function getLocation() {
  return new Promise((resolve) => {
    // First check if we have permission
    wx.getSetting({
      success: (settingRes) => {
        if (!settingRes.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => doGetLocation(resolve),
            fail: () => resolve('定位失败')
          });
        } else {
          doGetLocation(resolve);
        }
      },
      fail: () => resolve('定位失败')
    });
  });
}

function doGetLocation(resolve) {
  wx.getLocation({
    type: 'wgs84',
    success: async (res) => {
      console.log('Location got:', res.latitude, res.longitude);
      try {
        const city = await reverseGeocode(res.latitude, res.longitude);
        if (city) {
          resolve(city);
        } else {
          resolve(`${res.latitude.toFixed(2)}° ${res.longitude.toFixed(2)}°`);
        }
      } catch (e) {
        console.error('Nominatim error:', e);
        resolve(`${res.latitude.toFixed(2)}° ${res.longitude.toFixed(2)}°`);
      }
    },
    fail: (err) => {
      console.error('getLocation fail:', err);
      resolve('定位失败');
    }
  });
}

async function reverseGeocode(latitude, longitude) {
  const bigDataCity = await reverseByBigDataCloud(latitude, longitude);
  if (bigDataCity) return bigDataCity;

  return reverseByNominatim(latitude, longitude);
}

function reverseByBigDataCloud(latitude, longitude) {
  return new Promise((resolve) => {
    wx.request({
      url: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
      data: {
        latitude,
        longitude,
        localityLanguage: 'zh'
      },
      success: (resp) => {
        console.log('BigDataCloud location response:', resp);
        const data = resp.data || {};
        resolve(data.city || data.locality || data.principalSubdivision || '');
      },
      fail: (err) => {
        console.error('BigDataCloud location error:', err);
        resolve('');
      }
    });
  });
}

function reverseByNominatim(latitude, longitude) {
  return new Promise((resolve) => {
    wx.request({
      url: 'https://nominatim.openstreetmap.org/reverse',
      data: {
        format: 'json',
        lat: latitude,
        lon: longitude,
        'accept-language': 'zh-CN'
      },
      success: (resp) => {
        console.log('Nominatim response:', resp);
        if (resp.data && resp.data.address) {
          resolve(pickCityName(resp.data.address, resp.data.display_name));
          return;
        }

        resolve('');
      },
      fail: (err) => {
        console.error('Nominatim error:', err);
        resolve('');
      }
    });
  });
}

function pickCityName(address, displayName) {
  const city = address.city || address.municipality || address.state_district;
  if (city) return city;

  const cityFromDisplay = (displayName || '')
    .split(',')
    .map(item => item.trim())
    .find(item => /市$/.test(item) || /市辖区$/.test(item));
  if (cityFromDisplay) return cityFromDisplay.replace(/市辖区$/, '市');

  return address.state || address.county || address.town || address.village || '未知位置';
}

module.exports = { formatTime, getHourMark, getLocation };
