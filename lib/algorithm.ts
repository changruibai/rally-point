import type { Coordinate, DeparturePoint, Destination, DestinationRouteInfo, MeetingPlan, RouteInfo, TravelMode, TransitPlan } from '@/types';
import { searchRoute, searchRoutesInBatch, type RouteResult } from './routeService';

// 计算两点之间的直线距离（公里）
export function calculateDistance(p1: Coordinate, p2: Coordinate): number {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// 计算地理中心点
export function calculateCentroid(points: Coordinate[]): Coordinate {
  if (points.length === 0) {
    return { lng: 116.397428, lat: 39.90923 }; // 默认北京
  }

  const sumLng = points.reduce((sum, p) => sum + p.lng, 0);
  const sumLat = points.reduce((sum, p) => sum + p.lat, 0);

  return {
    lng: sumLng / points.length,
    lat: sumLat / points.length,
  };
}

// 基于出行方式估算时间（分钟）
export function estimateDuration(distance: number, mode: TravelMode): number {
  // 基础速度假设（公里/小时）
  const speeds: Record<TravelMode, number> = {
    driving: 40, // 市区平均 40km/h
    transit: 25, // 公共交通平均 25km/h（含换乘等待）
    walking: 5, // 步行 5km/h
  };

  const baseTime = (distance / speeds[mode]) * 60;

  // 添加固定时间成本
  const fixedCosts: Record<TravelMode, number> = {
    driving: 10, // 停车等
    transit: 15, // 等车换乘
    walking: 0,
  };

  return Math.round(baseTime + fixedCosts[mode]);
}

// 生成候选汇合点（考虑目的地）
export function generateCandidatePoints(
  departures: DeparturePoint[],
  destinations: Destination[] = []
): Coordinate[] {
  if (departures.length === 0) return [];

  const departureCoords = departures.map((d) => d.coordinate);
  const destinationCoords = destinations.map((d) => d.coordinate);
  
  // 所有点（出发点 + 目的地）
  const allCoords = [...departureCoords, ...destinationCoords];
  
  const candidates: Coordinate[] = [];

  // 出发点的几何中心
  const departureCentroid = calculateCentroid(departureCoords);

  // 如果有目的地，计算加权中心（目的地权重更高）
  let weightedCentroid: Coordinate;
  if (destinations.length > 0) {
    // 目的地权重为2，出发点权重为1
    const totalWeight = departures.length + destinations.length * 2;
    const weightedLng = 
      (departureCoords.reduce((sum, c) => sum + c.lng, 0) + 
       destinationCoords.reduce((sum, c) => sum + c.lng, 0) * 2) / totalWeight;
    const weightedLat = 
      (departureCoords.reduce((sum, c) => sum + c.lat, 0) + 
       destinationCoords.reduce((sum, c) => sum + c.lat, 0) * 2) / totalWeight;
    weightedCentroid = { lng: weightedLng, lat: weightedLat };
  } else {
    weightedCentroid = departureCentroid;
  }

  // 候选点1：加权中心（偏向目的地）
  candidates.push(weightedCentroid);

  // 候选点2：出发点几何中心
  if (destinations.length > 0) {
    candidates.push(departureCentroid);
  }

  // 候选点3-N：向各个目的地方向偏移的点
  // 在中心和目的地之间寻找合适位置
  for (const destCoord of destinationCoords) {
    // 在中心和目的地之间的 30%、50%、70% 位置
    const ratios = [0.3, 0.5, 0.7];
    for (const ratio of ratios) {
      candidates.push({
        lng: weightedCentroid.lng + (destCoord.lng - weightedCentroid.lng) * ratio,
        lat: weightedCentroid.lat + (destCoord.lat - weightedCentroid.lat) * ratio,
      });
    }
  }

  // 候选点：向各个出发点方向偏移的点
  for (const coord of departureCoords) {
    const offsetPoint = {
      lng: weightedCentroid.lng + (coord.lng - weightedCentroid.lng) * 0.3,
      lat: weightedCentroid.lat + (coord.lat - weightedCentroid.lat) * 0.3,
    };
    candidates.push(offsetPoint);
  }

  // 候选点：在中心点周围生成网格点
  const gridOffsets = [
    { lng: 0.01, lat: 0 },
    { lng: -0.01, lat: 0 },
    { lng: 0, lat: 0.01 },
    { lng: 0, lat: -0.01 },
    { lng: 0.007, lat: 0.007 },
    { lng: -0.007, lat: 0.007 },
    { lng: 0.007, lat: -0.007 },
    { lng: -0.007, lat: -0.007 },
  ];

  for (const offset of gridOffsets) {
    candidates.push({
      lng: weightedCentroid.lng + offset.lng,
      lat: weightedCentroid.lat + offset.lat,
    });
  }

  return candidates;
}

// 评估单个候选点（考虑目的地）
export function evaluateCandidate(
  candidate: Coordinate,
  departures: DeparturePoint[],
  destinations: Destination[] = []
): {
  routes: RouteInfo[];
  destinationRoutes: DestinationRouteInfo[];
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  durationVariance: number;
  avgDestinationDuration: number;
  score: number;
} {
  // 计算从各出发点到汇合点的路径
  const routes: RouteInfo[] = departures.map((dep) => {
    const distance = calculateDistance(dep.coordinate, candidate);
    const duration = estimateDuration(distance, dep.travelMode);
    return {
      departureId: dep.id,
      departureName: dep.name,
      duration,
      distance: Math.round(distance * 10) / 10,
      travelMode: dep.travelMode,
    };
  });

  // 计算从汇合点到各目的地的路径（默认使用公共交通估算）
  const destinationRoutes: DestinationRouteInfo[] = destinations.map((dest) => {
    const distance = calculateDistance(candidate, dest.coordinate);
    // 假设大家汇合后一起出行，使用公共交通估算
    const duration = estimateDuration(distance, 'transit');
    return {
      destinationId: dest.id,
      destinationName: dest.name,
      duration,
      distance: Math.round(distance * 10) / 10,
    };
  });

  const durations = routes.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  const durationVariance = maxDuration - minDuration;

  // 计算到目的地的平均耗时
  const avgDestinationDuration = destinationRoutes.length > 0
    ? destinationRoutes.reduce((sum, r) => sum + r.duration, 0) / destinationRoutes.length
    : 0;

  // 评分公式
  // - 到达汇合点的平均时间：权重 40%
  // - 公平性（时间差异）：权重 30%
  // - 到目的地的距离：权重 30%（如果有目的地）
  const avgScore = Math.max(0, 100 - avgDuration);
  const fairnessScore = Math.max(0, 100 - durationVariance * 2);
  
  let score: number;
  if (destinations.length > 0) {
    const destinationScore = Math.max(0, 100 - avgDestinationDuration * 1.5);
    score = avgScore * 0.4 + fairnessScore * 0.3 + destinationScore * 0.3;
  } else {
    score = avgScore * 0.6 + fairnessScore * 0.4;
  }

  return {
    routes,
    destinationRoutes,
    avgDuration: Math.round(avgDuration),
    maxDuration: Math.round(maxDuration),
    minDuration: Math.round(minDuration),
    durationVariance: Math.round(durationVariance),
    avgDestinationDuration: Math.round(avgDestinationDuration),
    score: Math.round(score),
  };
}

// 生成推荐理由（考虑目的地）
function generateRecommendation(
  plan: Omit<MeetingPlan, 'recommendation' | 'pros' | 'cons'>,
  rank: number,
  hasDestinations: boolean
): { recommendation: string; pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let recommendation = '';

  // 基于各种指标生成理由
  if (plan.durationVariance <= 10) {
    pros.push('各方出行时间非常均衡，没有人需要特别赶路');
  } else if (plan.durationVariance <= 20) {
    pros.push('各方出行时间较为均衡');
  } else {
    cons.push(`出行时间差异较大（相差约${plan.durationVariance}分钟）`);
  }

  if (plan.avgDuration <= 30) {
    pros.push('平均耗时短，大家都能快速到达');
  } else if (plan.avgDuration <= 45) {
    pros.push('平均耗时在合理范围内');
  } else {
    cons.push('整体耗时偏长，需要预留充足时间');
  }

  if (plan.maxDuration <= 40) {
    pros.push('最远的人也能在40分钟内到达');
  }

  // 检查是否有人特别近
  const shortRoutes = plan.routes.filter((r) => r.duration <= 15);
  if (shortRoutes.length > 0) {
    pros.push(`${shortRoutes.map((r) => r.departureName).join('、')}可以很快到达`);
  }

  // 检查是否有人特别远
  const longRoutes = plan.routes.filter((r) => r.duration >= 60);
  if (longRoutes.length > 0) {
    cons.push(`${longRoutes.map((r) => r.departureName).join('、')}需要较长时间`);
  }

  // 如果有目的地，添加目的地相关的优缺点
  if (hasDestinations && plan.destinationRoutes.length > 0) {
    if (plan.avgDestinationDuration <= 20) {
      pros.push(`距离目的地很近，汇合后只需约${plan.avgDestinationDuration}分钟`);
    } else if (plan.avgDestinationDuration <= 35) {
      pros.push(`到目的地路程适中，约${plan.avgDestinationDuration}分钟`);
    } else {
      cons.push(`汇合后到目的地还需约${plan.avgDestinationDuration}分钟`);
    }

    // 如果有多个目的地，检查是否能兼顾
    if (plan.destinationRoutes.length > 1) {
      const destDurations = plan.destinationRoutes.map(r => r.duration);
      const destVariance = Math.max(...destDurations) - Math.min(...destDurations);
      if (destVariance <= 15) {
        pros.push('到各目的地距离相近，便于灵活选择');
      }
    }
  }

  // 生成总结性推荐语
  if (rank === 1) {
    if (hasDestinations) {
      recommendation = '综合考虑各方出行和目的地位置的最优方案';
    } else {
      recommendation = pros.length > cons.length 
        ? '综合评分最高的方案，兼顾效率与公平性'
        : '相对最优的选择，建议优先考虑';
    }
  } else if (rank === 2) {
    if (hasDestinations) {
      recommendation = plan.avgDestinationDuration < 25 
        ? '更靠近目的地的备选方案'
        : '公平性较好的备选方案';
    } else {
      recommendation = plan.durationVariance < 15 
        ? '公平性较好的备选方案，各方时间差异小'
        : '效率优先的备选方案';
    }
  } else {
    recommendation = '第三备选方案，供参考对比';
  }

  return { recommendation, pros, cons };
}

// 主算法：生成推荐方案（支持目的地）
export function generateMeetingPlans(
  departures: DeparturePoint[],
  destinations: Destination[] = []
): MeetingPlan[] {
  if (departures.length < 2) {
    return [];
  }

  const hasDestinations = destinations.length > 0;

  // 生成候选点（考虑目的地）
  const candidates = generateCandidatePoints(departures, destinations);

  // 评估所有候选点
  const evaluatedPlans = candidates.map((candidate, index) => {
    const evaluation = evaluateCandidate(candidate, departures, destinations);
    return {
      id: `plan-${index}`,
      name: `汇合点 ${index + 1}`,
      address: '', // 需要通过逆地理编码获取
      coordinate: candidate,
      ...evaluation,
    };
  });

  // 按综合评分排序
  evaluatedPlans.sort((a, b) => b.score - a.score);

  // 选取前3个差异化的方案
  const selectedPlans: typeof evaluatedPlans = [];
  for (const plan of evaluatedPlans) {
    // 确保选中的方案之间有足够差异
    const isDifferent = selectedPlans.every((selected) => {
      const dist = calculateDistance(selected.coordinate, plan.coordinate);
      return dist > 0.5; // 至少相距500米
    });

    if (isDifferent || selectedPlans.length === 0) {
      selectedPlans.push(plan);
    }

    if (selectedPlans.length >= 3) break;
  }

  // 生成最终方案（带推荐理由）
  return selectedPlans.map((plan, index) => {
    const { recommendation, pros, cons } = generateRecommendation(plan, index + 1, hasDestinations);
    
    // 给方案起个友好的名字
    let names: string[];
    if (hasDestinations) {
      names = ['最佳汇合点', '靠近目的地', '均衡方案'];
    } else {
      names = ['最佳汇合点', '备选方案 A', '备选方案 B'];
    }
    
    return {
      ...plan,
      name: names[index] || `方案 ${index + 1}`,
      recommendation,
      pros,
      cons,
    };
  });
}

// 更新方案地址（通过逆地理编码）
export function updatePlanAddress(plan: MeetingPlan, address: string): MeetingPlan {
  return {
    ...plan,
    address,
  };
}

// 格式化时间显示
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

// 格式化距离显示
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}米`;
  }
  return `${km.toFixed(1)}公里`;
}

// 获取出行方式中文名
export function getTravelModeName(mode: TravelMode): string {
  const names: Record<TravelMode, string> = {
    driving: '自驾',
    transit: '公共交通',
    walking: '步行',
  };
  return names[mode];
}

// ============================================
// 以下是使用真实路径规划 API 的函数
// ============================================

/**
 * 使用真实 API 评估候选点
 * @param candidate 候选汇合点
 * @param departures 出发点列表
 * @param destinations 目的地列表
 * @param city 城市名（用于公交查询）
 */
export async function evaluateCandidateWithAPI(
  candidate: Coordinate,
  departures: DeparturePoint[],
  destinations: Destination[] = [],
  city: string = '北京'
): Promise<{
  routes: RouteInfo[];
  destinationRoutes: DestinationRouteInfo[];
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  durationVariance: number;
  avgDestinationDuration: number;
  score: number;
}> {
  // 并行查询所有出发点到候选点的路线
  const routeResults = await searchRoutesInBatch(
    departures.map(d => ({
      id: d.id,
      coordinate: d.coordinate,
      mode: d.travelMode,
      name: d.name,
    })),
    candidate,
    city
  );

  // 构建路径信息
  const routes: RouteInfo[] = departures.map((dep) => {
    const result = routeResults.get(dep.id);
    
    // 如果 API 查询失败，使用估算值
    if (!result) {
      const distance = calculateDistance(dep.coordinate, candidate);
      const duration = estimateDuration(distance, dep.travelMode);
      return {
        departureId: dep.id,
        departureName: dep.name,
        duration,
        distance: Math.round(distance * 10) / 10,
        travelMode: dep.travelMode,
      };
    }
    
    return {
      departureId: dep.id,
      departureName: dep.name,
      duration: result.duration,
      distance: result.distance,
      travelMode: dep.travelMode,
      transitPlan: result.transitPlan,
      drivingRoute: result.drivingRoute,
      walkingRoute: result.walkingRoute,
    };
  });

  // 查询从候选点到各目的地的路线（使用公交）
  const destinationRoutes: DestinationRouteInfo[] = await Promise.all(
    destinations.map(async (dest) => {
      const result = await searchRoute(candidate, dest.coordinate, 'transit', city);
      
      if (!result) {
        const distance = calculateDistance(candidate, dest.coordinate);
        const duration = estimateDuration(distance, 'transit');
        return {
          destinationId: dest.id,
          destinationName: dest.name,
          duration,
          distance: Math.round(distance * 10) / 10,
        };
      }
      
      return {
        destinationId: dest.id,
        destinationName: dest.name,
        duration: result.duration,
        distance: result.distance,
        transitPlan: result.transitPlan,
      };
    })
  );

  // 计算统计数据
  const durations = routes.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  const durationVariance = maxDuration - minDuration;

  const avgDestinationDuration = destinationRoutes.length > 0
    ? destinationRoutes.reduce((sum, r) => sum + r.duration, 0) / destinationRoutes.length
    : 0;

  // 计算评分
  const avgScore = Math.max(0, 100 - avgDuration);
  const fairnessScore = Math.max(0, 100 - durationVariance * 2);
  
  let score: number;
  if (destinations.length > 0) {
    const destinationScore = Math.max(0, 100 - avgDestinationDuration * 1.5);
    score = avgScore * 0.4 + fairnessScore * 0.3 + destinationScore * 0.3;
  } else {
    score = avgScore * 0.6 + fairnessScore * 0.4;
  }

  return {
    routes,
    destinationRoutes,
    avgDuration: Math.round(avgDuration),
    maxDuration: Math.round(maxDuration),
    minDuration: Math.round(minDuration),
    durationVariance: Math.round(durationVariance),
    avgDestinationDuration: Math.round(avgDestinationDuration),
    score: Math.round(score),
  };
}

/**
 * 使用真实 API 生成推荐方案
 * @param departures 出发点列表
 * @param destinations 目的地列表（可选）
 * @param city 城市名（默认北京）
 * @param useRealAPI 是否使用真实 API（默认 true）
 */
export async function generateMeetingPlansWithAPI(
  departures: DeparturePoint[],
  destinations: Destination[] = [],
  city: string = '北京',
  useRealAPI: boolean = true
): Promise<MeetingPlan[]> {
  if (departures.length < 2) {
    return [];
  }

  // 如果不使用真实 API，退回到估算版本
  if (!useRealAPI) {
    return generateMeetingPlans(departures, destinations);
  }

  const hasDestinations = destinations.length > 0;

  // 生成候选点（减少数量以节约 API 调用）
  const allCandidates = generateCandidatePoints(departures, destinations);
  
  // 只取前 8 个候选点进行真实 API 查询（避免调用太多次）
  const candidates = allCandidates.slice(0, 8);

  // 并行评估所有候选点
  const evaluatedPlans = await Promise.all(
    candidates.map(async (candidate, index) => {
      const evaluation = await evaluateCandidateWithAPI(candidate, departures, destinations, city);
      return {
        id: `plan-${index}`,
        name: `汇合点 ${index + 1}`,
        address: '',
        coordinate: candidate,
        ...evaluation,
      };
    })
  );

  // 按综合评分排序
  evaluatedPlans.sort((a, b) => b.score - a.score);

  // 选取前3个差异化的方案
  const selectedPlans: typeof evaluatedPlans = [];
  for (const plan of evaluatedPlans) {
    const isDifferent = selectedPlans.every((selected) => {
      const dist = calculateDistance(selected.coordinate, plan.coordinate);
      return dist > 0.5;
    });

    if (isDifferent || selectedPlans.length === 0) {
      selectedPlans.push(plan);
    }

    if (selectedPlans.length >= 3) break;
  }

  // 生成最终方案（带推荐理由）
  return selectedPlans.map((plan, index) => {
    const { recommendation, pros, cons } = generateRecommendationWithTransit(plan, index + 1, hasDestinations);
    
    let names: string[];
    if (hasDestinations) {
      names = ['最佳汇合点', '靠近目的地', '均衡方案'];
    } else {
      names = ['最佳汇合点', '备选方案 A', '备选方案 B'];
    }
    
    return {
      ...plan,
      name: names[index] || `方案 ${index + 1}`,
      recommendation,
      pros,
      cons,
    };
  });
}

/**
 * 生成推荐理由（考虑详细交通方式）
 */
function generateRecommendationWithTransit(
  plan: Omit<MeetingPlan, 'recommendation' | 'pros' | 'cons'>,
  rank: number,
  hasDestinations: boolean
): { recommendation: string; pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  let recommendation = '';

  // 基于各种指标生成理由
  if (plan.durationVariance <= 10) {
    pros.push('各方出行时间非常均衡，没有人需要特别赶路');
  } else if (plan.durationVariance <= 20) {
    pros.push('各方出行时间较为均衡');
  } else {
    cons.push(`出行时间差异较大（相差约${plan.durationVariance}分钟）`);
  }

  if (plan.avgDuration <= 30) {
    pros.push('平均耗时短，大家都能快速到达');
  } else if (plan.avgDuration <= 45) {
    pros.push('平均耗时在合理范围内');
  } else {
    cons.push('整体耗时偏长，需要预留充足时间');
  }

  // 分析交通方式
  const transitRoutes = plan.routes.filter(r => r.transitPlan);
  const subwayRoutes = transitRoutes.filter(r => 
    r.transitPlan?.segments.some(s => s.type === 'subway')
  );
  const busOnlyRoutes = transitRoutes.filter(r => 
    r.transitPlan?.segments.every(s => s.type === 'bus' || s.type === 'walk')
  );

  if (subwayRoutes.length > 0) {
    const subwayNames = subwayRoutes
      .map(r => r.departureName)
      .join('、');
    pros.push(`${subwayNames}可乘地铁直达，方便快捷`);
  }

  // 检查换乘次数
  const highTransferRoutes = transitRoutes.filter(r => {
    const transfers = r.transitPlan?.segments.filter(s => s.type !== 'walk').length || 0;
    return transfers > 2;
  });
  
  if (highTransferRoutes.length > 0) {
    cons.push(`${highTransferRoutes.map(r => r.departureName).join('、')}需要多次换乘`);
  }

  // 检查步行距离
  const longWalkRoutes = transitRoutes.filter(r => {
    return (r.transitPlan?.walkingDistance || 0) > 1000;
  });
  
  if (longWalkRoutes.length > 0) {
    cons.push(`${longWalkRoutes.map(r => r.departureName).join('、')}需要较长步行距离`);
  }

  // 检查是否有人特别近
  const shortRoutes = plan.routes.filter((r) => r.duration <= 15);
  if (shortRoutes.length > 0 && subwayRoutes.length === 0) {
    pros.push(`${shortRoutes.map((r) => r.departureName).join('、')}可以很快到达`);
  }

  // 检查是否有人特别远
  const longRoutes = plan.routes.filter((r) => r.duration >= 60);
  if (longRoutes.length > 0) {
    cons.push(`${longRoutes.map((r) => r.departureName).join('、')}需要较长时间`);
  }

  // 目的地相关
  if (hasDestinations && plan.destinationRoutes.length > 0) {
    if (plan.avgDestinationDuration <= 20) {
      pros.push(`距离目的地很近，汇合后只需约${plan.avgDestinationDuration}分钟`);
    } else if (plan.avgDestinationDuration <= 35) {
      pros.push(`到目的地路程适中，约${plan.avgDestinationDuration}分钟`);
    } else {
      cons.push(`汇合后到目的地还需约${plan.avgDestinationDuration}分钟`);
    }

    // 检查到目的地是否有地铁
    const destWithSubway = plan.destinationRoutes.filter(r => 
      r.transitPlan?.segments.some(s => s.type === 'subway')
    );
    if (destWithSubway.length > 0) {
      pros.push('到目的地可乘地铁');
    }
  }

  // 生成总结性推荐语
  if (rank === 1) {
    if (hasDestinations) {
      recommendation = '综合考虑各方出行和目的地位置的最优方案';
    } else {
      recommendation = pros.length > cons.length 
        ? '综合评分最高的方案，兼顾效率与公平性'
        : '相对最优的选择，建议优先考虑';
    }
  } else if (rank === 2) {
    if (hasDestinations) {
      recommendation = plan.avgDestinationDuration < 25 
        ? '更靠近目的地的备选方案'
        : '公平性较好的备选方案';
    } else {
      recommendation = plan.durationVariance < 15 
        ? '公平性较好的备选方案，各方时间差异小'
        : '效率优先的备选方案';
    }
  } else {
    recommendation = '第三备选方案，供参考对比';
  }

  return { recommendation, pros, cons };
}

