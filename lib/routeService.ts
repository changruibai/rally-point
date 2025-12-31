/**
 * 路径规划服务
 * 封装高德地图的驾车、公交、步行路径规划 API
 */

import type {
  Coordinate,
  TravelMode,
  TransitPlan,
  TransitSegment,
  TransitType,
  DrivingRoute,
  WalkingRoute,
  AMapInstance,
  AMapDriving,
  AMapTransfer,
  AMapWalking,
  TransferPlanDetail,
  TransferSegmentDetail,
  DrivingResult,
  TransferResult,
  WalkingResult,
} from '@/types';
import { loadAMapSDK } from './map';

// 缓存路径规划结果，避免重复请求
const routeCache = new Map<string, RouteResult>();

// 统一的路径规划结果
export interface RouteResult {
  duration: number;       // 耗时（分钟）
  distance: number;       // 距离（公里）
  transitPlan?: TransitPlan;
  drivingRoute?: DrivingRoute;
  walkingRoute?: WalkingRoute;
}

// 生成缓存 key
function getCacheKey(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode,
  city?: string
): string {
  return `${mode}-${origin.lng.toFixed(4)},${origin.lat.toFixed(4)}-${destination.lng.toFixed(4)},${destination.lat.toFixed(4)}-${city || ''}`;
}

// 地铁线路颜色映射（北京为例，可扩展）
const SUBWAY_COLORS: Record<string, string> = {
  '1号线': '#C23A30',
  '2号线': '#0D5EB3',
  '4号线': '#008A95',
  '5号线': '#A42177',
  '6号线': '#D09600',
  '7号线': '#F5BD35',
  '8号线': '#009B6B',
  '9号线': '#8FC31F',
  '10号线': '#009BC0',
  '13号线': '#F9E700',
  '14号线': '#D4A7A0',
  '15号线': '#6B3B7E',
  '昌平线': '#D698A6',
  '房山线': '#E66021',
  '亦庄线': '#E31D87',
  '八通线': '#C23A30',
  '机场线': '#A29BBB',
  '大兴机场线': '#016292',
};

// 获取地铁线路颜色
function getSubwayColor(lineName: string): string {
  for (const [key, color] of Object.entries(SUBWAY_COLORS)) {
    if (lineName.includes(key)) {
      return color;
    }
  }
  return '#0078D7'; // 默认蓝色
}

// 判断是否为地铁线路
function isSubwayLine(lineName: string): boolean {
  return lineName.includes('地铁') || lineName.includes('号线') || lineName.includes('轨道');
}

/**
 * 驾车路径规划
 */
export async function searchDrivingRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteResult | null> {
  const cacheKey = getCacheKey(origin, destination, 'driving');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const AMap = await loadAMapSDK();
    
    return new Promise((resolve) => {
      const driving = new AMap.Driving({
        extensions: 'all',
      }) as AMapDriving;

      driving.search(
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
        (status, result: DrivingResult) => {
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            const routeResult: RouteResult = {
              duration: Math.round(route.time / 60), // 秒转分钟
              distance: Math.round(route.distance / 100) / 10, // 米转公里，保留1位小数
              drivingRoute: {
                duration: Math.round(route.time / 60),
                distance: route.distance,
                tolls: route.tolls,
                trafficLights: route.traffic_lights,
              },
            };
            routeCache.set(cacheKey, routeResult);
            resolve(routeResult);
          } else {
            console.warn('Driving route search failed:', status, result);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Driving route error:', error);
    return null;
  }
}

/**
 * 公共交通路径规划（公交 + 地铁）
 */
export async function searchTransitRoute(
  origin: Coordinate,
  destination: Coordinate,
  city: string = '北京'
): Promise<RouteResult | null> {
  const cacheKey = getCacheKey(origin, destination, 'transit', city);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const AMap = await loadAMapSDK();
    
    return new Promise((resolve) => {
      const transfer = new AMap.Transfer({
        city: city,
        policy: 0, // 最快到达
        extensions: 'all',
      }) as AMapTransfer;

      transfer.search(
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
        (status, result: TransferResult) => {
          if (status === 'complete' && result.plans && result.plans.length > 0) {
            const plan = result.plans[0];
            const transitPlan = parseTransitPlan(plan);
            
            const routeResult: RouteResult = {
              duration: Math.round(plan.time / 60),
              distance: Math.round(plan.distance / 100) / 10,
              transitPlan,
            };
            
            routeCache.set(cacheKey, routeResult);
            resolve(routeResult);
          } else {
            console.warn('Transit route search failed:', status, result);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Transit route error:', error);
    return null;
  }
}

/**
 * 解析公交换乘方案，提取详细信息
 */
function parseTransitPlan(plan: TransferPlanDetail): TransitPlan {
  const segments: TransitSegment[] = [];
  
  for (const segment of plan.segments) {
    const parsedSegment = parseTransitSegment(segment);
    if (parsedSegment) {
      segments.push(parsedSegment);
    }
  }
  
  return {
    duration: Math.round(plan.time / 60),
    distance: plan.distance,
    walkingDistance: plan.walking_distance,
    cost: plan.cost,
    segments,
  };
}

/**
 * 解析单个换乘段
 */
function parseTransitSegment(segment: TransferSegmentDetail): TransitSegment | null {
  const mode = segment.transit_mode;
  
  // 步行段
  if (mode === 'WALK' && segment.walking) {
    const walk = segment.walking;
    return {
      type: 'walk',
      duration: Math.round(walk.time / 60),
      distance: walk.distance,
      instruction: walk.steps?.[0]?.instruction || '步行',
    };
  }
  
  // 公交/地铁段
  if ((mode === 'BUS' || mode === 'SUBWAY') && segment.buslines && segment.buslines.length > 0) {
    const busline = segment.buslines[0];
    const isSubway = isSubwayLine(busline.name);
    
    return {
      type: isSubway ? 'subway' : 'bus',
      lineName: busline.name,
      lineNumber: busline.id,
      startStation: busline.departure_stop?.name,
      endStation: busline.arrival_stop?.name,
      stationCount: busline.via_num + 1,
      duration: Math.round(busline.time / 60),
      distance: busline.distance,
      color: isSubway ? getSubwayColor(busline.name) : '#67A53B', // 公交绿色
    };
  }
  
  // 火车/地铁（铁路）
  if (mode === 'RAILWAY' && segment.railway) {
    const railway = segment.railway;
    return {
      type: 'railway',
      lineName: railway.name,
      startStation: railway.departure_stop?.name,
      endStation: railway.arrival_stop?.name,
      stationCount: railway.via_num + 1,
      duration: Math.round(railway.time / 60),
      distance: railway.distance,
      color: getSubwayColor(railway.name),
    };
  }
  
  // 出租车
  if (mode === 'TAXI' && segment.taxi) {
    return {
      type: 'taxi',
      duration: Math.round(segment.taxi.time / 60),
      distance: segment.taxi.distance,
      instruction: `打车约${segment.taxi.price}元`,
    };
  }
  
  return null;
}

/**
 * 步行路径规划
 */
export async function searchWalkingRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteResult | null> {
  const cacheKey = getCacheKey(origin, destination, 'walking');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const AMap = await loadAMapSDK();
    
    return new Promise((resolve) => {
      const walking = new AMap.Walking({}) as AMapWalking;

      walking.search(
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
        (status, result: WalkingResult) => {
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            const routeResult: RouteResult = {
              duration: Math.round(route.time / 60),
              distance: Math.round(route.distance / 100) / 10,
              walkingRoute: {
                duration: Math.round(route.time / 60),
                distance: route.distance,
              },
            };
            routeCache.set(cacheKey, routeResult);
            resolve(routeResult);
          } else {
            console.warn('Walking route search failed:', status, result);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error('Walking route error:', error);
    return null;
  }
}

/**
 * 统一路径规划入口
 * 根据出行方式调用对应的 API
 */
export async function searchRoute(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode,
  city?: string
): Promise<RouteResult | null> {
  switch (mode) {
    case 'driving':
      return searchDrivingRoute(origin, destination);
    case 'transit':
      return searchTransitRoute(origin, destination, city);
    case 'walking':
      return searchWalkingRoute(origin, destination);
    default:
      return null;
  }
}

/**
 * 批量路径规划
 * 对多个出发点到同一目的地进行并行规划
 */
export async function searchRoutesInBatch(
  origins: Array<{ id: string; coordinate: Coordinate; mode: TravelMode; name: string }>,
  destination: Coordinate,
  city?: string
): Promise<Map<string, RouteResult | null>> {
  const results = new Map<string, RouteResult | null>();
  
  const promises = origins.map(async (origin) => {
    const result = await searchRoute(origin.coordinate, destination, origin.mode, city);
    results.set(origin.id, result);
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * 清除路径缓存
 */
export function clearRouteCache(): void {
  routeCache.clear();
}

/**
 * 格式化公交方案为可读字符串
 */
export function formatTransitPlan(plan: TransitPlan): string {
  const parts: string[] = [];
  
  for (const segment of plan.segments) {
    if (segment.type === 'walk') {
      if (segment.distance > 100) {
        parts.push(`步行${Math.round(segment.distance)}米`);
      }
    } else if (segment.type === 'subway' || segment.type === 'bus') {
      parts.push(`${segment.lineName}(${segment.startStation}→${segment.endStation})`);
    } else if (segment.type === 'railway') {
      parts.push(`${segment.lineName}`);
    }
  }
  
  return parts.join(' → ');
}

/**
 * 获取公交方案的主要交通方式
 */
export function getMainTransitType(plan: TransitPlan): TransitType {
  // 找到耗时最长的非步行段
  const transitSegments = plan.segments.filter(s => s.type !== 'walk');
  if (transitSegments.length === 0) return 'walk';
  
  const sorted = transitSegments.sort((a, b) => b.duration - a.duration);
  return sorted[0].type;
}

/**
 * 获取公交方案涉及的所有线路
 */
export function getTransitLines(plan: TransitPlan): string[] {
  return plan.segments
    .filter(s => s.lineName)
    .map(s => s.lineName!);
}

