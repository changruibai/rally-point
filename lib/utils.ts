import { Coordinate, Participant } from '@/types';

/** 参与者颜色列表 */
export const PARTICIPANT_COLORS = [
  '#3498DB', // 蓝色
  '#E74C3C', // 红色
  '#2ECC71', // 绿色
  '#9B59B6', // 紫色
  '#F39C12', // 橙色
  '#1ABC9C', // 青色
  '#E91E63', // 粉色
  '#00BCD4', // 天蓝
];

/** 获取参与者颜色 */
export function getParticipantColor(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
}

/** 计算几何中心点 */
export function calculateGeometricCenter(coordinates: Coordinate[]): Coordinate {
  if (coordinates.length === 0) {
    return { lng: 116.397428, lat: 39.90923 }; // 默认北京天安门
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      lng: acc.lng + coord.lng,
      lat: acc.lat + coord.lat,
    }),
    { lng: 0, lat: 0 }
  );

  return {
    lng: sum.lng / coordinates.length,
    lat: sum.lat / coordinates.length,
  };
}

/** 计算两点间距离（米） */
export function calculateDistance(p1: Coordinate, p2: Coordinate): number {
  const R = 6371000; // 地球半径（米）
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) *
      Math.cos(toRad(p2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 计算方差 */
export function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

/** 格式化时间（分钟转为可读格式） */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 分钟';
  if (minutes < 60) return `${Math.round(minutes)} 分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
}

/** 格式化距离（米转为可读格式） */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} 米`;
  return `${(meters / 1000).toFixed(1)} 公里`;
}

/** 交通方式图标 */
export const TRANSPORT_ICONS: Record<string, string> = {
  walking: '🚶',
  cycling: '🚴',
  transit: '🚇',
  driving: '🚗',
};

/** 交通方式名称 */
export const TRANSPORT_NAMES: Record<string, string> = {
  walking: '步行',
  cycling: '骑行',
  transit: '公交',
  driving: '驾车',
};

/** POI 类型映射到高德 API types */
export const POI_TYPE_CODES: Record<string, string> = {
  restaurant: '050000', // 餐饮服务
  cafe: '050500',       // 咖啡厅
  subway: '150500',     // 地铁站
  mall: '060100',       // 购物中心
  parking: '150900',    // 停车场
};

/** POI 类型图标 */
export const POI_TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  subway: '🚇',
  mall: '🏬',
  parking: '🅿️',
  default: '📍',
};

/** POI 类型名称 */
export const POI_TYPE_NAMES: Record<string, string> = {
  restaurant: '餐厅',
  cafe: '咖啡厅',
  subway: '地铁站',
  mall: '商场',
  parking: '停车场',
};

/** 获取 POI 类型图标 */
export function getPOIIcon(type: string): string {
  // 根据高德 POI 类型编码判断
  if (type.startsWith('050')) return POI_TYPE_ICONS.restaurant;
  if (type.startsWith('0505')) return POI_TYPE_ICONS.cafe;
  if (type.startsWith('1505')) return POI_TYPE_ICONS.subway;
  if (type.startsWith('0601')) return POI_TYPE_ICONS.mall;
  if (type.startsWith('1509')) return POI_TYPE_ICONS.parking;
  return POI_TYPE_ICONS.default;
}

/** 防抖函数 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/** 生成唯一 ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/** 从参与者列表获取有效坐标 */
export function getValidCoordinates(participants: Participant[]): Coordinate[] {
  return participants
    .filter((p) => p.location !== null)
    .map((p) => p.location!.coordinate);
}


