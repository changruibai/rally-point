// 坐标点
export interface Coordinate {
  lng: number;
  lat: number;
}

// 出行方式
export type TravelMode = 'driving' | 'transit' | 'walking';

// 公交类型
export type TransitType = 'subway' | 'bus' | 'walk' | 'railway' | 'taxi';

// 公交段落信息
export interface TransitSegment {
  type: TransitType;          // 交通类型：地铁/公交/步行
  lineName?: string;          // 线路名称，如"地铁10号线"、"快速公交1号线"
  lineNumber?: string;        // 线路编号
  startStation?: string;      // 上车站
  endStation?: string;        // 下车站
  stationCount?: number;      // 经过站数
  duration: number;           // 该段耗时（分钟）
  distance: number;           // 该段距离（米）
  color?: string;             // 线路颜色（用于显示）
  instruction?: string;       // 导航指令
}

// 公交换乘方案
export interface TransitPlan {
  duration: number;           // 总耗时（分钟）
  distance: number;           // 总距离（米）
  walkingDistance: number;    // 步行距离（米）
  cost?: number;              // 预估费用（元）
  segments: TransitSegment[]; // 各段详情
}

// 驾车路径信息
export interface DrivingRoute {
  duration: number;           // 耗时（分钟）
  distance: number;           // 距离（米）
  tolls?: number;             // 过路费（元）
  trafficLights?: number;     // 红绿灯数量
  congestion?: 'smooth' | 'slow' | 'congested'; // 拥堵状况
}

// 步行路径信息
export interface WalkingRoute {
  duration: number;           // 耗时（分钟）
  distance: number;           // 距离（米）
}

// 出发点
export interface DeparturePoint {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  travelMode: TravelMode;
}

// 目的地
export interface Destination {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
}

// 每个出发点到汇合点的路径信息
export interface RouteInfo {
  departureId: string;
  departureName: string;
  duration: number; // 分钟
  distance: number; // 公里
  travelMode: TravelMode;
  // 详细路径信息（可选，仅当使用真实 API 时有值）
  transitPlan?: TransitPlan;   // 公共交通方案
  drivingRoute?: DrivingRoute; // 驾车路径
  walkingRoute?: WalkingRoute; // 步行路径
}

// 到目的地的路径信息
export interface DestinationRouteInfo {
  destinationId: string;
  destinationName: string;
  duration: number; // 从汇合点到目的地的预计时间（分钟）
  distance: number; // 公里
  transitPlan?: TransitPlan; // 公共交通方案详情
}

// 推荐方案
export interface MeetingPlan {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  routes: RouteInfo[];
  destinationRoutes: DestinationRouteInfo[]; // 到各目的地的路径信息
  avgDuration: number; // 平均耗时
  maxDuration: number; // 最长耗时
  minDuration: number; // 最短耗时
  durationVariance: number; // 时间差异（公平性指标）
  avgDestinationDuration: number; // 到目的地的平均耗时
  recommendation: string; // 推荐理由
  pros: string[]; // 优点
  cons: string[]; // 缺点
  score: number; // 综合评分 0-100
}

// 地图 API 类型扩展
export interface AMapInstance {
  Map: new (container: string | HTMLElement, options: AMapOptions) => AMapMap;
  Marker: new (options: MarkerOptions) => AMapMarker;
  Circle: new (options: CircleOptions) => AMapCircle;
  InfoWindow: new (options: InfoWindowOptions) => AMapInfoWindow;
  Geocoder: new () => AMapGeocoder;
  Driving: new (options: DrivingOptions) => AMapDriving;
  Transfer: new (options: TransferOptions) => AMapTransfer;
  Walking: new (options: WalkingOptions) => AMapWalking;
  LngLat: new (lng: number, lat: number) => AMapLngLat;
  plugin: (plugins: string[], callback: () => void) => void;
}

export interface AMapOptions {
  zoom?: number;
  center?: [number, number];
  mapStyle?: string;
  viewMode?: '2D' | '3D';
}

export interface AMapMap {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setFitView: (markers?: AMapMarker[]) => void;
  add: (overlay: AMapMarker | AMapCircle) => void;
  remove: (overlay: AMapMarker | AMapCircle) => void;
  clearMap: () => void;
  destroy: () => void;
  on: (event: string, handler: (e: unknown) => void) => void;
}

export interface MarkerOptions {
  position: [number, number];
  title?: string;
  icon?: string;
  content?: string | HTMLElement;
  offset?: [number, number];
  anchor?: string;
}

export interface AMapMarker {
  setPosition: (position: [number, number]) => void;
  getPosition: () => AMapLngLat;
  setMap: (map: AMapMap | null) => void;
  on: (event: string, handler: (e: unknown) => void) => void;
}

export interface CircleOptions {
  center: [number, number];
  radius: number;
  strokeColor?: string;
  strokeWeight?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface AMapCircle {
  setCenter: (center: [number, number]) => void;
  setRadius: (radius: number) => void;
  setMap: (map: AMapMap | null) => void;
}

export interface InfoWindowOptions {
  content: string | HTMLElement;
  offset?: [number, number];
}

export interface AMapInfoWindow {
  open: (map: AMapMap, position: [number, number]) => void;
  close: () => void;
}

export interface AMapGeocoder {
  getLocation: (address: string, callback: (status: string, result: GeocoderResult) => void) => void;
  getAddress: (lnglat: [number, number], callback: (status: string, result: ReGeocoderResult) => void) => void;
}

export interface GeocoderResult {
  geocodes: Array<{
    location: AMapLngLat;
    formattedAddress: string;
  }>;
}

export interface ReGeocoderResult {
  regeocode: {
    formattedAddress: string;
    addressComponent: {
      city: string;
      district: string;
      township: string;
    };
  };
}

export interface DrivingOptions {
  policy?: number;
  extensions?: string;
  map?: AMapMap;
  panel?: string | HTMLElement;
}

export interface AMapDriving {
  search: (
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: DrivingResult) => void
  ) => void;
  clear: () => void;
}

// 驾车路径步骤
export interface DrivingStep {
  instruction: string;     // 导航指令
  road: string;            // 道路名
  distance: number;        // 距离（米）
  time: number;            // 耗时（秒）
  action: string;          // 动作，如"左转"
  assistant_action: string; // 辅助动作
}

// 驾车路线详情
export interface DrivingRouteDetail {
  distance: number;        // 距离（米）
  time: number;            // 耗时（秒）
  policy: string;          // 策略
  tolls: number;           // 过路费
  tolls_distance: number;  // 收费路段长度
  traffic_lights: number;  // 红绿灯数
  steps: DrivingStep[];    // 步骤
}

export interface DrivingResult {
  info: string;
  origin: AMapLngLat;
  destination: AMapLngLat;
  taxi_cost: number;       // 预估打车费用
  routes: DrivingRouteDetail[];
}

export interface TransferOptions {
  city: string;
  policy?: number;
  extensions?: string;
}

export interface AMapTransfer {
  search: (
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: TransferResult) => void
  ) => void;
  clear: () => void;
}

// 公交换乘步行段
export interface TransferWalkingStep {
  instruction: string;
  road: string;
  distance: number;
  time: number;
}

export interface TransferWalking {
  origin: AMapLngLat;
  destination: AMapLngLat;
  distance: number;
  time: number;
  steps: TransferWalkingStep[];
}

// 公交/地铁线路段
export interface TransferRailway {
  name: string;         // 线路名称
  id: string;
  type: string;         // 类型：地铁、火车等
  trip: string;         // 车次
  time: number;         // 耗时（秒）
  distance: number;     // 距离（米）
  departure_stop: {     // 上车站
    name: string;
    location: AMapLngLat;
    time: string;
  };
  arrival_stop: {       // 下车站
    name: string;
    location: AMapLngLat;
    time: string;
  };
  via_num: number;      // 途经站数
  via_stops: Array<{    // 途经站点
    name: string;
    location: AMapLngLat;
    time: string;
  }>;
}

export interface TransferBusLine {
  name: string;           // 线路名称，如"快速公交1线"
  id: string;
  type: string;           // 类型
  busTimeTips: string;    // 首末班车时间
  start_time: string;     // 首班时间
  end_time: string;       // 末班时间
  via_num: number;        // 途经站数
  via_stops: Array<{      // 途经站点
    name: string;
    location: AMapLngLat;
    sequence: number;
  }>;
  departure_stop: {       // 上车站
    name: string;
    location: AMapLngLat;
  };
  arrival_stop: {         // 下车站
    name: string;
    location: AMapLngLat;
  };
  distance: number;       // 距离（米）
  time: number;           // 耗时（秒）
  cost?: number;          // 费用
}

// 公交换乘段
export interface TransferSegmentDetail {
  transit_mode: 'WALK' | 'BUS' | 'SUBWAY' | 'RAILWAY' | 'TAXI';
  walking?: TransferWalking;
  buslines?: TransferBusLine[];
  railway?: TransferRailway;
  taxi?: {
    distance: number;
    time: number;
    price: number;
  };
}

// 换乘方案
export interface TransferPlanDetail {
  cost: number;           // 总费用
  distance: number;       // 总距离（米）
  time: number;           // 总时间（秒）
  walking_distance: number; // 步行距离
  transit_fee: number;    // 公交费用
  nightflag: boolean;     // 是否夜班车
  segments: TransferSegmentDetail[]; // 各换乘段
}

export interface TransferResult {
  info: string;
  origin: AMapLngLat;
  destination: AMapLngLat;
  start: string;
  end: string;
  taxi_cost: number;
  plans: TransferPlanDetail[];
}

export interface WalkingOptions {
  map?: AMapMap;
  panel?: string | HTMLElement;
}

export interface AMapWalking {
  search: (
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: WalkingResult) => void
  ) => void;
  clear: () => void;
}

// 步行路线步骤
export interface WalkingStep {
  instruction: string;     // 导航指令
  road: string;            // 道路名
  distance: number;        // 距离（米）
  time: number;            // 耗时（秒）
  action: string;          // 动作
  assistant_action: string;
}

// 步行路线详情
export interface WalkingRouteDetail {
  distance: number;        // 距离（米）
  time: number;            // 耗时（秒）
  steps: WalkingStep[];    // 步骤
}

export interface WalkingResult {
  info: string;
  origin: AMapLngLat;
  destination: AMapLngLat;
  routes: WalkingRouteDetail[];
}

export interface AMapLngLat {
  getLng: () => number;
  getLat: () => number;
}

