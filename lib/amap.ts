import { Coordinate } from '@/types';

/** 高德地图 JS API 加载状态 */
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

/** 加载高德地图 JS API */
export function loadAMapScript(): Promise<void> {
  if (isLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (isLoading) return;
    isLoading = true;

    const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
    const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE;

    if (!key) {
      reject(new Error('缺少高德地图 JS API Key'));
      return;
    }

    // 设置安全密钥
    if (securityCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      };
    }

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.Geolocation`;
    script.async = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error('高德地图加载失败'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/** 坐标转换：数组转对象 */
export function arrayToCoordinate(arr: [number, number]): Coordinate {
  return { lng: arr[0], lat: arr[1] };
}

/** 坐标转换：对象转数组 */
export function coordinateToArray(coord: Coordinate): [number, number] {
  // 确保坐标有效，防止 NaN 传入地图 API
  const lng = Number(coord.lng);
  const lat = Number(coord.lat);
  if (isNaN(lng) || isNaN(lat)) {
    console.error('coordinateToArray: 无效坐标', coord);
    throw new Error(`Invalid coordinate: lng=${coord.lng}, lat=${coord.lat}`);
  }
  return [lng, lat];
}

/** 坐标转换：字符串转对象 */
export function stringToCoordinate(str: string): Coordinate {
  const [lng, lat] = str.split(',').map(Number);
  return { lng, lat };
}

/** 坐标转换：对象转字符串 */
export function coordinateToString(coord: Coordinate): string {
  return `${coord.lng},${coord.lat}`;
}

/** 创建标记图标 */
export function createMarkerIcon(
  color: string,
  label?: string
): AMap.Icon | AMap.Content {
  // 使用 SVG 创建自定义图标
  const svg = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${color}"/>
      <circle cx="16" cy="14" r="6" fill="white"/>
      ${label ? `<text x="16" y="18" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${label}</text>` : ''}
    </svg>
  `;
  return new AMap.Icon({
    size: new AMap.Size(32, 40),
    image: `data:image/svg+xml;base64,${btoa(svg)}`,
    imageSize: new AMap.Size(32, 40),
  });
}

/** 创建集合点标记图标 */
export function createMeetingPointIcon(): AMap.Icon {
  const svg = `
    <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 28 20 28s20-16.954 20-28C40 8.954 31.046 0 20 0z" fill="#FF6B35"/>
      <circle cx="20" cy="18" r="10" fill="white"/>
      <text x="20" y="22" text-anchor="middle" fill="#FF6B35" font-size="14">★</text>
    </svg>
  `;
  return new AMap.Icon({
    size: new AMap.Size(40, 48),
    image: `data:image/svg+xml;base64,${btoa(svg)}`,
    imageSize: new AMap.Size(40, 48),
    imageOffset: new AMap.Pixel(0, 0),
  });
}

/** 获取适合显示所有点的地图视野 */
export function fitMapView(
  map: AMap.Map,
  coordinates: Coordinate[],
  padding?: [number, number, number, number]
): void {
  try {
    // 过滤有效坐标
    const validCoords = coordinates.filter(
      (coord) => coord && typeof coord.lng === 'number' && typeof coord.lat === 'number' &&
                 !isNaN(coord.lng) && !isNaN(coord.lat)
    );
    
    if (validCoords.length === 0) return;

    if (validCoords.length === 1) {
      const center = coordinateToArray(validCoords[0]);
      map.setCenter(center);
      map.setZoom(15);
      return;
    }

    // 计算边界
    let minLng = validCoords[0].lng;
    let maxLng = validCoords[0].lng;
    let minLat = validCoords[0].lat;
    let maxLat = validCoords[0].lat;

    validCoords.forEach((coord) => {
      if (coord.lng < minLng) minLng = coord.lng;
      if (coord.lng > maxLng) maxLng = coord.lng;
      if (coord.lat < minLat) minLat = coord.lat;
      if (coord.lat > maxLat) maxLat = coord.lat;
    });

    // 验证计算出的边界是否有效
    if (isNaN(minLng) || isNaN(maxLng) || isNaN(minLat) || isNaN(maxLat)) {
      console.warn('fitMapView: 计算出的边界无效', { minLng, maxLng, minLat, maxLat });
      return;
    }

    const bounds = new AMap.Bounds(
      [minLng, minLat],
      [maxLng, maxLat]
    );

    map.setBounds(bounds, false, padding || [80, 80, 80, 80]);
  } catch (error) {
    console.error('fitMapView 错误:', error);
    // 出错时尝试使用第一个有效坐标居中
    const validCoord = coordinates.find(
      (coord) => coord && typeof coord.lng === 'number' && typeof coord.lat === 'number' &&
                 !isNaN(coord.lng) && !isNaN(coord.lat)
    );
    if (validCoord) {
      try {
        map.setCenter([validCoord.lng, validCoord.lat]);
        map.setZoom(12);
      } catch {
        // 忽略
      }
    }
  }
}

/** 地址搜索 */
export async function searchAddress(
  keyword: string,
  city?: string
): Promise<AMap.PlaceSearch.SearchResult['poiList']['pois']> {
  await loadAMapScript();

  return new Promise((resolve, reject) => {
    const placeSearch = new AMap.PlaceSearch({
      city: city || '全国',
      pageSize: 10,
      pageIndex: 1,
    });

    placeSearch.search(keyword, (status: string, result: AMap.PlaceSearch.SearchResult) => {
      if (status === 'complete' && result.poiList) {
        resolve(result.poiList.pois);
      } else if (status === 'no_data') {
        resolve([]);
      } else {
        reject(new Error('搜索失败'));
      }
    });
  });
}

/** 获取当前位置 */
export async function getCurrentPosition(): Promise<Coordinate> {
  await loadAMapScript();

  return new Promise((resolve, reject) => {
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: AMap.Geolocation.GeolocationResult) => {
      if (status === 'complete' && result.position) {
        // 高德地图 LngLat 对象可能需要使用方法或属性获取值
        const pos = result.position;
        const lng = typeof pos.getLng === 'function' ? pos.getLng() : pos.lng;
        const lat = typeof pos.getLat === 'function' ? pos.getLat() : pos.lat;
        
        // 验证坐标有效性
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          resolve({ lng, lat });
        } else {
          reject(new Error('获取位置失败：坐标无效'));
        }
      } else {
        reject(new Error('获取位置失败'));
      }
    });
  });
}

/** 逆地理编码 - 坐标转地址 */
export async function reverseGeocode(coord: Coordinate): Promise<string> {
  await loadAMapScript();

  return new Promise((resolve, reject) => {
    const geocoder = new AMap.Geocoder();
    geocoder.getAddress(
      coordinateToArray(coord),
      (status: string, result: AMap.Geocoder.ReGeocodeResult) => {
        if (status === 'complete' && result.regeocode) {
          resolve(result.regeocode.formattedAddress);
        } else {
          reject(new Error('地址解析失败'));
        }
      }
    );
  });
}

