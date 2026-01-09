import { MeetingPlan, CalculateStrategy, Route, Coordinate } from '@/types';
import { calculateVariance, calculateDistance } from './utils';

/**
 * 公平性得分计算 - 最小化最大时间（公平优先）
 * 目标：让等待时间最长的人尽可能少等
 */
export function fairnessScore(times: number[]): number {
  if (times.length === 0) return 0;
  return -Math.max(...times);
}

/**
 * 效率得分计算 - 最小化总时间（效率优先）
 * 目标：所有人的总出行时间最少
 */
export function efficiencyScore(times: number[]): number {
  if (times.length === 0) return 0;
  return -times.reduce((a, b) => a + b, 0);
}

/**
 * 平衡策略得分计算（默认）
 * 综合考虑最大时间、总时间和时间方差
 */
export function balancedScore(times: number[]): number {
  if (times.length === 0) return 0;
  const max = Math.max(...times);
  const sum = times.reduce((a, b) => a + b, 0);
  const variance = calculateVariance(times);
  // 权重：最大时间 40%，总时间 30%，方差 30%
  return -(0.4 * max + 0.3 * sum + 0.3 * variance * 10);
}

/**
 * 根据策略计算得分
 */
export function calculateScore(
  times: number[],
  strategy: CalculateStrategy
): number {
  switch (strategy) {
    case 'fair':
      return fairnessScore(times);
    case 'efficient':
      return efficiencyScore(times);
    case 'balanced':
    default:
      return balancedScore(times);
  }
}

/**
 * 计算方案统计数据
 */
export function calculatePlanStats(routes: Route[]): {
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
  avgDuration: number;
} {
  const times = routes.map((r) => r.duration);
  if (times.length === 0) {
    return { totalDuration: 0, maxDuration: 0, minDuration: 0, avgDuration: 0 };
  }
  return {
    totalDuration: times.reduce((a, b) => a + b, 0),
    maxDuration: Math.max(...times),
    minDuration: Math.min(...times),
    avgDuration: times.reduce((a, b) => a + b, 0) / times.length,
  };
}

/**
 * 对集合点方案排序
 */
export function sortMeetingPlans(
  plans: MeetingPlan[],
  strategy: CalculateStrategy
): MeetingPlan[] {
  return [...plans].sort((a, b) => {
    const timesA = a.routes.map((r) => r.duration);
    const timesB = b.routes.map((r) => r.duration);
    return calculateScore(timesB, strategy) - calculateScore(timesA, strategy);
  });
}

/**
 * 计算搜索半径
 * 根据参与者分布范围动态调整
 */
export function calculateSearchRadius(
  distances: number[],
  baseRadius: number = 1000
): number {
  if (distances.length === 0) return baseRadius;
  const maxDistance = Math.max(...distances);
  // 搜索半径为最大距离的 1/4，但不小于基础半径，不大于 5km
  return Math.min(Math.max(maxDistance / 4, baseRadius), 5000);
}

/**
 * 计算考虑目的地的加权得分
 * 
 * 核心思想：好的集合点应该满足：
 * 1. 所有人到集合点的时间公平
 * 2. 集合点应该在「去目的地的路上」，减少绕路
 * 
 * @param toMeetingTimes 各参与者到集合点的时间
 * @param meetingPointCoord 集合点坐标
 * @param participantCoords 参与者坐标
 * @param destinationCoord 目的地坐标
 * @param strategy 计算策略
 */
export function calculateDestinationAwareScore(
  toMeetingTimes: number[],
  meetingPointCoord: Coordinate,
  participantCoords: Coordinate[],
  destinationCoord: Coordinate,
  strategy: CalculateStrategy
): number {
  // 基础得分（时间公平性）
  const baseScore = calculateScore(toMeetingTimes, strategy);
  
  // 计算「在路上」的奖励分数
  // 思路：如果集合点在参与者们去目的地的路径上，给予奖励
  let onTheWayBonus = 0;
  
  for (const pCoord of participantCoords) {
    // 参与者直接去目的地的距离
    const directDistance = calculateDistance(pCoord, destinationCoord);
    
    // 经过集合点去目的地的距离
    const viaDistance = 
      calculateDistance(pCoord, meetingPointCoord) + 
      calculateDistance(meetingPointCoord, destinationCoord);
    
    // 绕路比例：越接近 1 表示集合点越在路上
    const detourRatio = directDistance > 0 ? viaDistance / directDistance : 1;
    
    // 如果几乎不绕路（比例 < 1.3），给予奖励
    // 如果绕路很多（比例 > 1.5），给予惩罚
    if (detourRatio < 1.3) {
      onTheWayBonus += 10 * (1.3 - detourRatio); // 最多 +3 分
    } else if (detourRatio > 1.5) {
      onTheWayBonus -= 5 * (detourRatio - 1.5); // 惩罚绕路
    }
  }
  
  // 集合点到目的地的距离也要考虑（太远的集合点不好）
  const meetingToDestDistance = calculateDistance(meetingPointCoord, destinationCoord);
  // 假设平均速度 30km/h，转换为时间惩罚
  const distancePenalty = -(meetingToDestDistance / 1000) * 2; // 每公里 -2 分
  
  return baseScore + onTheWayBonus + distancePenalty;
}

/**
 * 考虑目的地的方案排序
 */
export function sortMeetingPlansWithDestination(
  plans: MeetingPlan[],
  participantCoords: Coordinate[],
  destinationCoord: Coordinate,
  strategy: CalculateStrategy
): MeetingPlan[] {
  return [...plans].sort((a, b) => {
    const timesA = a.routes.map((r) => r.duration);
    const timesB = b.routes.map((r) => r.duration);
    
    const scoreA = calculateDestinationAwareScore(
      timesA,
      a.poi.location.coordinate,
      participantCoords,
      destinationCoord,
      strategy
    );
    const scoreB = calculateDestinationAwareScore(
      timesB,
      b.poi.location.coordinate,
      participantCoords,
      destinationCoord,
      strategy
    );
    
    return scoreB - scoreA;
  });
}

/**
 * 计算考虑目的地的搜索中心
 * 中心点应该偏向目的地方向
 */
export function calculateSearchCenterWithDestination(
  participantCoords: Coordinate[],
  destinationCoord: Coordinate
): Coordinate {
  if (participantCoords.length === 0) {
    return destinationCoord;
  }
  
  // 计算参与者的几何中心
  const center = {
    lng: participantCoords.reduce((sum, c) => sum + c.lng, 0) / participantCoords.length,
    lat: participantCoords.reduce((sum, c) => sum + c.lat, 0) / participantCoords.length,
  };
  
  // 搜索中心偏向目的地方向（权重 0.3）
  // 这样找到的 POI 更可能在去目的地的路上
  return {
    lng: center.lng * 0.7 + destinationCoord.lng * 0.3,
    lat: center.lat * 0.7 + destinationCoord.lat * 0.3,
  };
}
