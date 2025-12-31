// 坐标点
export interface Coordinate {
  lng: number;
  lat: number;
}

// 出行方式
export type TravelMode = 'driving' | 'transit' | 'walking';

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
}

// 到目的地的路径信息
export interface DestinationRouteInfo {
  destinationId: string;
  destinationName: string;
  duration: number; // 从汇合点到目的地的预计时间（分钟）
  distance: number; // 公里
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
}

export interface AMapDriving {
  search: (
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: DrivingResult) => void
  ) => void;
}

export interface DrivingResult {
  routes: Array<{
    distance: number;
    time: number;
  }>;
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
}

export interface TransferResult {
  plans: Array<{
    distance: number;
    time: number;
  }>;
}

export interface WalkingOptions {
  // empty for now
}

export interface AMapWalking {
  search: (
    origin: [number, number],
    destination: [number, number],
    callback: (status: string, result: WalkingResult) => void
  ) => void;
}

export interface WalkingResult {
  routes: Array<{
    distance: number;
    time: number;
  }>;
}

export interface AMapLngLat {
  getLng: () => number;
  getLat: () => number;
}

