/** 交通方式 */
export type TransportMode = 'walking' | 'cycling' | 'transit' | 'driving';

/** 地理坐标 */
export interface Coordinate {
  lng: number;
  lat: number;
}

/** 地点信息 */
export interface Location {
  coordinate: Coordinate;
  address: string;
  name?: string;
}

/** 参与者 */
export interface Participant {
  id: string;
  name: string;
  location: Location | null;
  transportMode: TransportMode;
  color: string;
}

/** POI 类型 */
export type POIType = 
  | 'restaurant'    // 餐厅
  | 'cafe'          // 咖啡厅
  | 'subway'        // 地铁站
  | 'mall'          // 商场
  | 'parking';      // 停车场

/** POI 信息 */
export interface POI {
  id: string;
  name: string;
  type: string;
  typeName: string;
  location: Location;
  distance?: number;
}

/** 路线信息 */
export interface Route {
  participantId: string;
  duration: number;      // 分钟
  distance: number;      // 米
  path: Coordinate[];    // 路线坐标点
}

/** 集合点方案 */
export interface MeetingPlan {
  poi: POI;
  routes: Route[];
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
  avgDuration: number;
  fairnessScore: number;
}

/** 计算策略 */
export type CalculateStrategy = 'fair' | 'efficient' | 'balanced';

/** 场景模式 */
export type ScenarioMode = 'meetup' | 'destination';

/** 计算请求 */
export interface CalculateRequest {
  participants: Participant[];
  poiTypes?: POIType[];
  strategy?: CalculateStrategy;
  scenarioMode?: ScenarioMode;
  destination?: Location;      // 目的地（destination 模式必须）
}

/** 计算响应 */
export interface CalculateResponse {
  bestPlan: MeetingPlan;
  alternatives: MeetingPlan[];
  searchCenter: Coordinate;
  destination?: Location;  // 目的地（如果有）
}

/** POI 搜索请求 */
export interface SearchPOIRequest {
  center: Coordinate;
  radius: number;
  types?: string[];
}

/** 路线规划请求 */
export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
  mode: TransportMode;
  city?: string;
}

/** 路线规划响应 */
export interface RouteResponse {
  duration: number;
  distance: number;
  path: Coordinate[];
}

/** 高德地图类型声明 */
declare global {
  interface Window {
    AMap: typeof AMap;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

export {};
