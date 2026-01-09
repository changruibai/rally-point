import {
  Participant,
  MeetingPlan,
  Coordinate,
  POI,
  RouteResponse,
  TransportMode,
  CalculateStrategy,
  POIType,
  Route,
  ScenarioMode,
  Location,
} from '@/types';
import {
  calculateGeometricCenter,
  getValidCoordinates,
  POI_TYPE_CODES,
} from './utils';
import { calculatePlanStats, calculateScore, sortMeetingPlans } from './algorithm';

/** API 基础路径 */
const API_BASE = '/api';

/** 搜索 POI */
export async function searchPOI(
  center: Coordinate,
  radius: number,
  types?: string[]
): Promise<POI[]> {
  const params = new URLSearchParams({
    lng: center.lng.toString(),
    lat: center.lat.toString(),
    radius: radius.toString(),
  });

  if (types && types.length > 0) {
    params.append('types', types.join('|'));
  }

  const response = await fetch(`${API_BASE}/search-poi?${params}`);
  if (!response.ok) {
    throw new Error('POI 搜索失败');
  }

  const data = await response.json();
  return data.pois;
}

/** 获取路线规划 */
export async function getRoute(
  origin: Coordinate,
  destination: Coordinate,
  mode: TransportMode,
  city?: string
): Promise<RouteResponse> {
  const params = new URLSearchParams({
    originLng: origin.lng.toString(),
    originLat: origin.lat.toString(),
    destLng: destination.lng.toString(),
    destLat: destination.lat.toString(),
    mode,
  });

  if (city) {
    params.append('city', city);
  }

  const response = await fetch(`${API_BASE}/route?${params}`);
  if (!response.ok) {
    throw new Error('路线规划失败');
  }

  return response.json();
}

/** 计算所有参与者到某个 POI 的路线 */
async function calculateRoutesToPOI(
  participants: Participant[],
  poi: POI
): Promise<Route[]> {
  const routes: Route[] = [];

  for (const participant of participants) {
    if (!participant.location) continue;

    try {
      const routeResponse = await getRoute(
        participant.location.coordinate,
        poi.location.coordinate,
        participant.transportMode
      );

      routes.push({
        participantId: participant.id,
        duration: routeResponse.duration,
        distance: routeResponse.distance,
        path: routeResponse.path,
      });
    } catch (error) {
      console.error(`获取 ${participant.name} 的路线失败:`, error);
      // 使用估算时间
      routes.push({
        participantId: participant.id,
        duration: 30, // 默认 30 分钟
        distance: 0,
        path: [],
      });
    }
  }

  return routes;
}

/** 主计算函数 - 计算最佳集合点（调用服务端 API） */
export async function calculateMeetingPoint(
  participants: Participant[],
  poiTypes: POIType[],
  strategy: CalculateStrategy,
  onProgress?: (message: string) => void,
  scenarioMode: ScenarioMode = 'meetup',
  destination?: Location | null
): Promise<{
  bestPlan: MeetingPlan;
  alternatives: MeetingPlan[];
  searchCenter: Coordinate;
  destination?: Location;
}> {
  // 验证参与者
  const validParticipants = participants.filter((p) => p.location !== null);
  if (validParticipants.length < 2) {
    throw new Error('至少需要 2 个有效的参与者位置');
  }

  // 验证目的地模式
  if (scenarioMode === 'destination' && !destination) {
    throw new Error('目的地模式需要设置目的地');
  }

  onProgress?.('正在计算最佳集合点...');

  // 调用服务端 API
  const response = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      participants,
      poiTypes,
      strategy,
      scenarioMode,
      destination: destination || undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '计算失败，请稍后重试');
  }

  onProgress?.('正在生成推荐结果...');
  return response.json();
}

/** 主计算函数（客户端版本，不使用服务端 API） */
export async function calculateMeetingPointLocal(
  participants: Participant[],
  poiTypes: POIType[],
  strategy: CalculateStrategy,
  onProgress?: (message: string) => void
): Promise<{
  bestPlan: MeetingPlan;
  alternatives: MeetingPlan[];
  searchCenter: Coordinate;
}> {
  // 验证参与者
  const validParticipants = participants.filter((p) => p.location !== null);
  if (validParticipants.length < 2) {
    throw new Error('至少需要 2 个有效的参与者位置');
  }

  // 1. 计算几何中心
  onProgress?.('正在计算中心区域...');
  const coordinates = getValidCoordinates(participants);
  const center = calculateGeometricCenter(coordinates);

  // 2. 转换 POI 类型
  const typeCodes = poiTypes.map((t) => POI_TYPE_CODES[t] || '').filter(Boolean);

  // 3. 搜索候选 POI
  onProgress?.('正在搜索候选集合点...');
  let pois: POI[] = [];
  let searchRadius = 1000; // 初始搜索半径 1km

  // 分层搜索
  while (pois.length < 5 && searchRadius <= 5000) {
    pois = await searchPOI(center, searchRadius, typeCodes);
    if (pois.length < 5) {
      searchRadius += 1000;
    }
  }

  if (pois.length === 0) {
    throw new Error('未找到合适的集合点，请尝试扩大搜索范围');
  }

  // 限制候选点数量
  const candidatePOIs = pois.slice(0, 10);

  // 4. 计算每个候选点的路线和得分
  onProgress?.('正在计算路线...');
  const plans: MeetingPlan[] = [];

  for (let i = 0; i < candidatePOIs.length; i++) {
    const poi = candidatePOIs[i];
    onProgress?.(`正在计算路线 (${i + 1}/${candidatePOIs.length})...`);

    const routes = await calculateRoutesToPOI(validParticipants, poi);
    const stats = calculatePlanStats(routes);
    const times = routes.map((r) => r.duration);
    const score = calculateScore(times, strategy);

    plans.push({
      poi,
      routes,
      ...stats,
      fairnessScore: score,
    });
  }

  // 5. 排序并返回结果
  onProgress?.('正在生成推荐结果...');
  const sortedPlans = sortMeetingPlans(plans, strategy);

  return {
    bestPlan: sortedPlans[0],
    alternatives: sortedPlans.slice(1, 3), // 返回 Top 3
    searchCenter: center,
  };
}

