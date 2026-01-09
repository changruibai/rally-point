import { NextRequest, NextResponse } from 'next/server';
import { Participant, POIType, CalculateStrategy, POI, Route, MeetingPlan, Coordinate, Location, ScenarioMode } from '@/types';
import { calculateGeometricCenter, getValidCoordinates, POI_TYPE_CODES } from '@/lib/utils';
import { 
  calculatePlanStats, 
  calculateScore, 
  sortMeetingPlans,
  calculateDestinationAwareScore,
  sortMeetingPlansWithDestination,
  calculateSearchCenterWithDestination
} from '@/lib/algorithm';

/** 高德 API Key */
const AMAP_KEY = process.env.AMAP_WEB_KEY;

/** 请求体类型 */
interface CalculateRequestBody {
  participants: Participant[];
  poiTypes?: POIType[];
  strategy?: CalculateStrategy;
  scenarioMode?: ScenarioMode;
  destination?: Location;
}

/** 计算集合点 API */
export async function POST(request: NextRequest) {
  if (!AMAP_KEY) {
    return NextResponse.json(
      { error: '未配置高德地图 API Key' },
      { status: 500 }
    );
  }

  try {
    const body: CalculateRequestBody = await request.json();
    const { 
      participants, 
      poiTypes = ['cafe', 'restaurant'], 
      strategy = 'balanced',
      scenarioMode = 'meetup',
      destination 
    } = body;

    // 验证参与者
    const validParticipants = participants.filter((p) => p.location !== null);
    if (validParticipants.length < 2) {
      return NextResponse.json(
        { error: '至少需要 2 个有效的参与者位置' },
        { status: 400 }
      );
    }

    // 验证目的地（如果是 destination 模式）
    if (scenarioMode === 'destination' && !destination) {
      return NextResponse.json(
        { error: '目的地模式需要设置目的地' },
        { status: 400 }
      );
    }

    // 1. 计算几何中心（考虑目的地）
    const coordinates = getValidCoordinates(participants);
    let center: Coordinate;
    
    if (scenarioMode === 'destination' && destination) {
      // 搜索中心偏向目的地方向
      center = calculateSearchCenterWithDestination(coordinates, destination.coordinate);
    } else {
      center = calculateGeometricCenter(coordinates);
    }

    // 2. 转换 POI 类型码
    const typeCodes = poiTypes
      .map((t) => POI_TYPE_CODES[t] || '')
      .filter(Boolean)
      .join('|');

    // 3. 搜索候选 POI
    const pois = await searchPOIs(center, 2000, typeCodes);
    if (pois.length === 0) {
      return NextResponse.json(
        { error: '未找到合适的集合点' },
        { status: 404 }
      );
    }

    // 4. 限制候选点数量并计算路线
    const candidatePOIs = pois.slice(0, 8);
    const plans: MeetingPlan[] = [];

    for (const poi of candidatePOIs) {
      const routes = await calculateRoutes(validParticipants, poi);
      const stats = calculatePlanStats(routes);
      const times = routes.map((r) => r.duration);
      
      // 根据场景模式选择得分计算方式
      let score: number;
      if (scenarioMode === 'destination' && destination) {
        score = calculateDestinationAwareScore(
          times,
          poi.location.coordinate,
          coordinates,
          destination.coordinate,
          strategy
        );
      } else {
        score = calculateScore(times, strategy);
      }

      plans.push({
        poi,
        routes,
        ...stats,
        fairnessScore: score,
      });
    }

    // 5. 排序结果（考虑目的地）
    let sortedPlans: MeetingPlan[];
    if (scenarioMode === 'destination' && destination) {
      sortedPlans = sortMeetingPlansWithDestination(
        plans,
        coordinates,
        destination.coordinate,
        strategy
      );
    } else {
      sortedPlans = sortMeetingPlans(plans, strategy);
    }

    return NextResponse.json({
      bestPlan: sortedPlans[0],
      alternatives: sortedPlans.slice(1, 3),
      searchCenter: center,
      // 返回目的地信息用于前端显示
      destination: scenarioMode === 'destination' ? destination : undefined,
    });
  } catch (error) {
    console.error('计算集合点错误:', error);
    return NextResponse.json(
      { error: '计算失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/** 搜索 POI */
async function searchPOIs(
  center: Coordinate,
  radius: number,
  types: string
): Promise<POI[]> {
  const url = new URL('https://restapi.amap.com/v5/place/around');
  url.searchParams.append('key', AMAP_KEY!);
  url.searchParams.append('location', `${center.lng},${center.lat}`);
  url.searchParams.append('radius', radius.toString());
  url.searchParams.append('types', types || '050000|060000');
  url.searchParams.append('page_size', '20');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== '1') {
    console.error('POI 搜索失败:', data);
    return [];
  }

  return (data.pois || [])
    .map((poi: {
      id: string;
      name: string;
      type: string;
      typecode: string;
      location: string;
      distance?: string;
      address?: string;
    }) => {
      // 验证坐标格式
      if (!poi.location || typeof poi.location !== 'string') {
        return null;
      }
      const [lng, lat] = poi.location.split(',').map(Number);
      if (isNaN(lng) || isNaN(lat)) {
        console.warn('POI 坐标无效:', poi.name, poi.location);
        return null;
      }

      const location: Location = {
        coordinate: { lng, lat },
        address: poi.address || '',
        name: poi.name,
      };

      return {
        id: poi.id,
        name: poi.name,
        type: poi.typecode,
        typeName: poi.type,
        location,
        distance: poi.distance ? parseInt(poi.distance) : undefined,
      };
    })
    .filter((poi): poi is POI => poi !== null);
}

/** 计算所有参与者到 POI 的路线 */
async function calculateRoutes(
  participants: Participant[],
  poi: POI
): Promise<Route[]> {
  const routes: Route[] = [];
  const destination = poi.location.coordinate;

  for (const participant of participants) {
    if (!participant.location) continue;

    try {
      const route = await getRoute(
        participant.location.coordinate,
        destination,
        participant.transportMode
      );
      routes.push({
        participantId: participant.id,
        ...route,
      });
    } catch (error) {
      console.error(`路线计算失败 (${participant.name}):`, error);
      // 使用估算
      routes.push({
        participantId: participant.id,
        duration: 30,
        distance: 0,
        path: [],
      });
    }
  }

  return routes;
}

/** 获取单条路线 */
async function getRoute(
  origin: Coordinate,
  destination: Coordinate,
  mode: string
): Promise<{ duration: number; distance: number; path: Coordinate[] }> {
  let url: URL;
  const originStr = `${origin.lng},${origin.lat}`;
  const destStr = `${destination.lng},${destination.lat}`;

  switch (mode) {
    case 'walking':
      url = new URL('https://restapi.amap.com/v5/direction/walking');
      break;
    case 'cycling':
      url = new URL('https://restapi.amap.com/v5/direction/bicycling');
      break;
    case 'transit':
      url = new URL('https://restapi.amap.com/v5/direction/transit/integrated');
      url.searchParams.append('city1', '010');
      url.searchParams.append('city2', '010');
      break;
    default:
      url = new URL('https://restapi.amap.com/v5/direction/driving');
  }

  url.searchParams.append('key', AMAP_KEY!);
  url.searchParams.append('origin', originStr);
  url.searchParams.append('destination', destStr);
  url.searchParams.append('show_fields', 'cost,polyline');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== '1') {
    throw new Error(data.info || '路线规划失败');
  }

  return parseRouteResult(data, mode);
}

/** 解析路线结果 */
function parseRouteResult(
  data: { route?: { paths?: Array<{ duration?: string; distance?: string; polyline?: string }>; transits?: Array<{ cost?: { duration?: string }; distance?: string; segments?: Array<{ walking?: { steps?: Array<{ polyline?: string }> }; bus?: { buslines?: Array<{ polyline?: string }> }; railway?: { polyline?: string } }> }> } },
  mode: string
): { duration: number; distance: number; path: Coordinate[] } {
  const route = data.route;

  if (!route) {
    return { duration: 30, distance: 0, path: [] };
  }

  if (mode === 'transit') {
    const transit = route.transits?.[0];
    if (!transit) return { duration: 30, distance: 0, path: [] };

    const duration = parseInt(transit.cost?.duration || '1800') / 60;
    const distance = parseInt(transit.distance || '0');
    const path = parseTransitPath(transit);

    return { duration, distance, path };
  }

  const pathData = route.paths?.[0];
  if (!pathData) return { duration: 30, distance: 0, path: [] };

  const duration = parseInt(pathData.duration || '1800') / 60;
  const distance = parseInt(pathData.distance || '0');
  const path = parsePolyline(pathData.polyline || '');

  return { duration, distance, path };
}

/** 解析公交路线 */
function parseTransitPath(transit: { segments?: Array<{ walking?: { steps?: Array<{ polyline?: string }> }; bus?: { buslines?: Array<{ polyline?: string }> }; railway?: { polyline?: string } }> }): Coordinate[] {
  const path: Coordinate[] = [];
  const segments = transit.segments || [];

  for (const segment of segments) {
    if (segment.walking?.steps) {
      for (const step of segment.walking.steps) {
        if (step.polyline) path.push(...parsePolyline(step.polyline));
      }
    }
    if (segment.bus?.buslines?.[0]?.polyline) {
      path.push(...parsePolyline(segment.bus.buslines[0].polyline));
    }
    if (segment.railway?.polyline) {
      path.push(...parsePolyline(segment.railway.polyline));
    }
  }

  return path;
}

/** 解析 polyline */
function parsePolyline(polyline: string): Coordinate[] {
  if (!polyline) return [];
  return polyline.split(';')
    .map((point) => {
      const [lng, lat] = point.split(',').map(Number);
      return { lng, lat };
    })
    .filter((coord) => !isNaN(coord.lng) && !isNaN(coord.lat));
}

