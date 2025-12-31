import type { AMapInstance, AMapMap, AMapGeocoder, Coordinate } from '@/types';

let AMap: AMapInstance | null = null;
let mapInstance: AMapMap | null = null;

// 高德地图 Key（请替换为你自己的 Key）
// 申请地址：https://console.amap.com/dev/key/app
export const AMAP_KEY = '你的高德地图Key';
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
    script.src = `https://webapi.amap.com/maps?v=${AMAP_VERSION}&key=${AMAP_KEY}&plugin=AMap.Geocoder,AMap.Driving,AMap.Transfer,AMap.Walking`;
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

