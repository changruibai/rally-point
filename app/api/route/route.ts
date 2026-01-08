import { NextRequest, NextResponse } from 'next/server';
import { Coordinate, TransportMode, RouteResponse } from '@/types';

/** 高德路线规划 API */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originLng = searchParams.get('originLng');
  const originLat = searchParams.get('originLat');
  const destLng = searchParams.get('destLng');
  const destLat = searchParams.get('destLat');
  const mode = (searchParams.get('mode') || 'driving') as TransportMode;
  const city = searchParams.get('city') || '010'; // 默认北京

  if (!originLng || !originLat || !destLng || !destLat) {
    return NextResponse.json(
      { error: '缺少必要参数' },
      { status: 400 }
    );
  }

  const apiKey = process.env.AMAP_WEB_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: '未配置高德地图 API Key' },
      { status: 500 }
    );
  }

  const origin = `${originLng},${originLat}`;
  const destination = `${destLng},${destLat}`;

  try {
    let url: URL;
    let response: Response;
    let data: AmapRouteResponse;

    // 根据交通方式选择不同的 API
    switch (mode) {
      case 'walking':
        url = new URL('https://restapi.amap.com/v5/direction/walking');
        url.searchParams.append('key', apiKey);
        url.searchParams.append('origin', origin);
        url.searchParams.append('destination', destination);
        break;

      case 'cycling':
        url = new URL('https://restapi.amap.com/v5/direction/bicycling');
        url.searchParams.append('key', apiKey);
        url.searchParams.append('origin', origin);
        url.searchParams.append('destination', destination);
        break;

      case 'transit':
        url = new URL('https://restapi.amap.com/v5/direction/transit/integrated');
        url.searchParams.append('key', apiKey);
        url.searchParams.append('origin', origin);
        url.searchParams.append('destination', destination);
        url.searchParams.append('city1', city);
        url.searchParams.append('city2', city);
        url.searchParams.append('show_fields', 'cost');
        break;

      case 'driving':
      default:
        url = new URL('https://restapi.amap.com/v5/direction/driving');
        url.searchParams.append('key', apiKey);
        url.searchParams.append('origin', origin);
        url.searchParams.append('destination', destination);
        url.searchParams.append('show_fields', 'cost,polyline');
        break;
    }

    response = await fetch(url.toString());
    data = await response.json();

    if (data.status !== '1') {
      console.error('高德路线 API 错误:', data);
      return NextResponse.json(
        { error: data.info || '路线规划失败' },
        { status: 500 }
      );
    }

    // 解析结果
    const result = parseRouteResult(data, mode);
    return NextResponse.json(result);
  } catch (error) {
    console.error('路线规划错误:', error);
    return NextResponse.json(
      { error: '路线规划失败' },
      { status: 500 }
    );
  }
}

/** 高德 API 响应类型 */
interface AmapRouteResponse {
  status: string;
  info: string;
  route?: {
    paths?: Array<{
      duration?: string;
      distance?: string;
      polyline?: string;
      steps?: Array<{
        polyline?: string;
      }>;
    }>;
    transits?: Array<{
      cost?: {
        duration?: string;
      };
      distance?: string;
      segments?: Array<{
        walking?: {
          steps?: Array<{
            polyline?: string;
          }>;
        };
        bus?: {
          buslines?: Array<{
            polyline?: string;
          }>;
        };
        railway?: {
          polyline?: string;
        };
      }>;
    }>;
  };
}

/** 解析路线结果 */
function parseRouteResult(
  data: AmapRouteResponse,
  mode: TransportMode
): RouteResponse {
  const route = data.route;

  if (!route) {
    return {
      duration: 30, // 默认 30 分钟
      distance: 0,
      path: [],
    };
  }

  if (mode === 'transit') {
    // 公交路线
    const transit = route.transits?.[0];
    if (!transit) {
      return { duration: 30, distance: 0, path: [] };
    }

    const duration = parseInt(transit.cost?.duration || '1800') / 60; // 秒转分钟
    const distance = parseInt(transit.distance || '0');
    const path = parseTransitPath(transit);

    return { duration, distance, path };
  } else {
    // 步行/骑行/驾车
    const pathData = route.paths?.[0];
    if (!pathData) {
      return { duration: 30, distance: 0, path: [] };
    }

    const duration = parseInt(pathData.duration || '1800') / 60; // 秒转分钟
    const distance = parseInt(pathData.distance || '0');
    const path = parsePolyline(pathData.polyline || '');

    return { duration, distance, path };
  }
}

/** 解析公交路线路径 */
function parseTransitPath(transit: NonNullable<AmapRouteResponse['route']>['transits'][0]): Coordinate[] {
  const path: Coordinate[] = [];
  const segments = transit.segments || [];

  for (const segment of segments) {
    // 步行路段
    if (segment.walking?.steps) {
      for (const step of segment.walking.steps) {
        if (step.polyline) {
          path.push(...parsePolyline(step.polyline));
        }
      }
    }

    // 公交路段
    if (segment.bus?.buslines?.[0]?.polyline) {
      path.push(...parsePolyline(segment.bus.buslines[0].polyline));
    }

    // 地铁/轨道交通
    if (segment.railway?.polyline) {
      path.push(...parsePolyline(segment.railway.polyline));
    }
  }

  return path;
}

/** 解析高德 polyline 格式 */
function parsePolyline(polyline: string): Coordinate[] {
  if (!polyline) return [];

  return polyline.split(';')
    .map((point) => {
      const [lng, lat] = point.split(',').map(Number);
      return { lng, lat };
    })
    .filter((coord) => !isNaN(coord.lng) && !isNaN(coord.lat));
}

