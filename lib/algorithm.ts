import { MeetingPlan, CalculateStrategy, Route } from '@/types';
import { calculateVariance } from './utils';

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
