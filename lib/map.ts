import type { AMapInstance, AMapMap, AMapGeocoder, Coordinate } from '@/types';

let AMap: AMapInstance | null = null;
let mapInstance: AMapMap | null = null;

// 高德地图 Key
// 优先使用环境变量，如果没有则使用默认值
export const AMAP_KEY = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_AMAP_KEY || 'ba543da123648e2dae27d91c7015bc55')
  : 'ba543da123648e2dae27d91c7015bc55';
export const AMAP_VERSION = '2.0';

// 加载高德地图 SDK
export async function loadAMapSDK(): Promise<AMapInstance> {
  if (AMap) return AMap;

  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if ((window as unknown as { AMap: AMapInstance }).AMap) {
      AMap = (window as unknown as { AMap: AMapInstance }).AMap;
      resolve(AMap);
      return;
    }

    // 动态加载脚本
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Driving,AMap.Transfer,AMap.Walking,AMap.PlaceSearch,AMap.AutoComplete`;
    script.async = true;
    script.onload = () => {
      AMap = (window as unknown as { AMap: AMapInstance }).AMap;
      if (AMap) {
        resolve(AMap);
      } else {
        reject(new Error('Failed to load AMap SDK'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load AMap script'));
    document.head.appendChild(script);
  });
}

// 初始化地图
export async function initMap(container: string | HTMLElement): Promise<AMapMap> {
  const sdk = await loadAMapSDK();
  
  mapInstance = new sdk.Map(container, {
    zoom: 12,
    center: [116.397428, 39.90923], // 默认北京
    mapStyle: 'amap://styles/fresh', // 清新风格
    viewMode: '2D',
  });

  return mapInstance;
}

// 获取当前地图实例
export function getMapInstance(): AMapMap | null {
  return mapInstance;
}

// 销毁地图
export function destroyMap(): void {
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
  }
}

// 地址转坐标
export async function geocode(address: string): Promise<{ coordinate: Coordinate; formattedAddress: string } | null> {
  const sdk = await loadAMapSDK();
  
  return new Promise((resolve) => {
    const geocoder = new sdk.Geocoder() as AMapGeocoder;
    geocoder.getLocation(address, (status, result) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const location = result.geocodes[0].location;
        resolve({
          coordinate: {
            lng: location.getLng(),
            lat: location.getLat(),
          },
          formattedAddress: result.geocodes[0].formattedAddress,
        });
      } else {
        resolve(null);
      }
    });
  });
}

// 坐标转地址
export async function reverseGeocode(coordinate: Coordinate): Promise<string | null> {
  const sdk = await loadAMapSDK();
  
  return new Promise((resolve) => {
    const geocoder = new sdk.Geocoder() as AMapGeocoder;
    geocoder.getAddress([coordinate.lng, coordinate.lat], (status, result) => {
      if (status === 'complete') {
        resolve(result.regeocode.formattedAddress);
      } else {
        resolve(null);
      }
    });
  });
}

// 创建标记点
export function createMarker(
  coordinate: Coordinate,
  options: {
    type: 'departure' | 'meeting';
    label?: string;
    index?: number;
  }
) {
  if (!AMap) return null;

  const { type, label, index } = options;
  
  // 不同类型的标记样式
  const markerContent = type === 'departure'
    ? `<div class="marker-departure">
        <div class="marker-icon">${index !== undefined ? index + 1 : '📍'}</div>
        ${label ? `<div class="marker-label">${label}</div>` : ''}
      </div>`
    : `<div class="marker-meeting">
        <div class="marker-icon">🎯</div>
        ${label ? `<div class="marker-label">${label}</div>` : ''}
      </div>`;

  const marker = new AMap.Marker({
    position: [coordinate.lng, coordinate.lat],
    content: markerContent,
    offset: [-20, -40],
  });

  return marker;
}

// 创建圆形区域
export function createCircle(center: Coordinate, radius: number) {
  if (!AMap) return null;

  return new AMap.Circle({
    center: [center.lng, center.lat],
    radius: radius * 1000, // 转换为米
    strokeColor: '#22c55e',
    strokeWeight: 2,
    fillColor: '#22c55e',
    fillOpacity: 0.1,
  });
}

// 模拟逆地理编码（在没有 API Key 时使用）
export function getMockAddress(coordinate: Coordinate): string {
  // 基于坐标生成模拟地址
  const districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '石景山区'];
  const streets = ['建国路', '中关村大街', '长安街', '西单北大街', '三里屯路', '望京西路'];
  
  const districtIndex = Math.abs(Math.floor(coordinate.lng * 10)) % districts.length;
  const streetIndex = Math.abs(Math.floor(coordinate.lat * 10)) % streets.length;
  const number = Math.abs(Math.floor((coordinate.lng + coordinate.lat) * 100)) % 200 + 1;
  
  return `北京市${districts[districtIndex]}${streets[streetIndex]}${number}号附近`;
}

// POI 搜索结果类型
export interface POISearchResult {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  type: string;
  district: string;
}

// POI 搜索
export async function searchPOI(
  keyword: string,
  city: string = '北京'
): Promise<POISearchResult[]> {
  try {
    const sdk = await loadAMapSDK();
    
    return new Promise((resolve) => {
      // 使用 PlaceSearch 插件
      sdk.plugin('AMap.PlaceSearch', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const placeSearch = new (sdk as any).PlaceSearch({
          city: city,
          citylimit: false, // 不限制城市
          extensions: 'all',
          pageSize: 20,
        });

        placeSearch.search(keyword, (status: string, result: {
          info: string;
          poiList?: {
            pois: Array<{
              id: string;
              name: string;
              address: string;
              location: AMapLngLat;
              type: string;
              pname: string;
              cityname: string;
              adname: string;
            }>;
          };
        }) => {
          if (status === 'complete' && result.poiList && result.poiList.pois) {
            const results: POISearchResult[] = result.poiList.pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
              coordinate: {
                lng: poi.location.getLng(),
                lat: poi.location.getLat(),
              },
              type: poi.type,
              district: poi.adname || poi.cityname,
            }));
            resolve(results);
          } else {
            console.warn('POI search failed:', status, result);
            resolve([]);
          }
        });
      });
    });
  } catch (error) {
    console.error('POI search error:', error);
    return [];
  }
}

// 输入提示搜索（更轻量级，适合输入时实时搜索）
export async function searchAutoComplete(
  keyword: string,
  city: string = '北京'
): Promise<POISearchResult[]> {
  try {
    const sdk = await loadAMapSDK();
    
    return new Promise((resolve) => {
      sdk.plugin('AMap.AutoComplete', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const autoComplete = new (sdk as any).AutoComplete({
          city: city,
          citylimit: false,
        });

        autoComplete.search(keyword, (status: string, result: {
          info: string;
          tips?: Array<{
            id: string;
            name: string;
            address: string;
            location?: AMapLngLat;
            district: string;
          }>;
        }) => {
          if (status === 'complete' && result.tips) {
            const results: POISearchResult[] = result.tips
              .filter(tip => tip.location) // 只保留有坐标的结果
              .map(tip => ({
                id: tip.id,
                name: tip.name,
                address: tip.address || tip.district,
                coordinate: {
                  lng: tip.location!.getLng(),
                  lat: tip.location!.getLat(),
                },
                type: '',
                district: tip.district,
              }));
            resolve(results);
          } else {
            // 如果 AutoComplete 失败，回退到 POI 搜索
            searchPOI(keyword, city).then(resolve);
          }
        });
      });
    });
  } catch (error) {
    console.error('AutoComplete error:', error);
    // 回退到 POI 搜索
    return searchPOI(keyword, city);
  }
}

// 生成高德地图导航链接
export function generateAmapNavUrl(
  destination: Coordinate,
  destName: string,
  origin?: Coordinate,
  originName?: string
): string {
  const baseUrl = 'https://uri.amap.com/navigation';
  const params = new URLSearchParams({
    to: `${destination.lng},${destination.lat},${encodeURIComponent(destName)}`,
    mode: 'car',
    policy: '1', // 推荐路线
    src: 'rally-point',
    coordinate: 'gaode',
    callnative: '1', // 优先调用高德地图 APP
  });
  
  if (origin && originName) {
    params.set('from', `${origin.lng},${origin.lat},${encodeURIComponent(originName)}`);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

// 生成百度地图导航链接
export function generateBaiduNavUrl(
  destination: Coordinate,
  destName: string
): string {
  // 需要将高德坐标转换为百度坐标（简单偏移，实际应使用坐标转换 API）
  // 这里使用 gcj02tobdll 的近似转换
  const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
  const x = destination.lng;
  const y = destination.lat;
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
  const bd_lng = z * Math.cos(theta) + 0.0065;
  const bd_lat = z * Math.sin(theta) + 0.006;
  
  const baseUrl = 'https://api.map.baidu.com/direction';
  const params = new URLSearchParams({
    destination: `latlng:${bd_lat},${bd_lng}|name:${destName}`,
    mode: 'driving',
    origin: '', // 当前位置
    output: 'html',
    src: 'rally-point',
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// 生成腾讯地图导航链接
export function generateQQMapNavUrl(
  destination: Coordinate,
  destName: string
): string {
  const baseUrl = 'https://apis.map.qq.com/uri/v1/routeplan';
  const params = new URLSearchParams({
    type: 'drive',
    tocoord: `${destination.lat},${destination.lng}`,
    to: destName,
    policy: '0', // 较快
    referer: 'rally-point',
  });
  
  return `${baseUrl}?${params.toString()}`;
}

