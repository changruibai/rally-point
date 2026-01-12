/** 高德地图 TypeScript 类型声明 */

declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions);
    setCenter(center: [number, number]): void;
    setZoom(zoom: number): void;
    setBounds(bounds: Bounds, immediately?: boolean, padding?: [number, number, number, number]): void;
    add(overlay: Overlay | Overlay[]): void;
    remove(overlay: Overlay | Overlay[]): void;
    on(event: string, handler: (e: MapEventResult) => void): void;
    off(event: string, handler: (e: MapEventResult) => void): void;
    destroy(): void;
    getCenter(): LngLat;
    getZoom(): number;
  }

  interface MapOptions {
    zoom?: number;
    center?: [number, number];
    viewMode?: '2D' | '3D';
    mapStyle?: string;
    features?: string[];
    layers?: Layer[];
  }

  interface MapEventResult {
    lnglat: LngLat;
    pixel: Pixel;
    type: string;
    target: Map;
  }

  class LngLat {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
    getLng(): number;
    getLat(): number;
    offset(w: number, s: number): LngLat;
    distance(lnglat: LngLat): number;
  }

  class Pixel {
    constructor(x: number, y: number);
    x: number;
    y: number;
    getX(): number;
    getY(): number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
    getWidth(): number;
    getHeight(): number;
  }

  class Bounds {
    constructor(southWest: [number, number], northEast: [number, number]);
    extend(point: [number, number]): void;
    contains(point: [number, number]): boolean;
    getCenter(): LngLat;
    getSouthWest(): LngLat;
    getNorthEast(): LngLat;
  }

  type Overlay = Marker | Polyline | Polygon | Circle | InfoWindow;

  class Marker {
    constructor(options?: MarkerOptions);
    setPosition(position: [number, number]): void;
    getPosition(): LngLat;
    setContent(content: string | HTMLElement): void;
    setIcon(icon: Icon | string): void;
    setTitle(title: string): void;
    setOffset(offset: Pixel): void;
    setExtData(data: unknown): void;
    getExtData(): unknown;
    on(event: string, handler: (e: MarkerEventResult) => void): void;
    off(event: string, handler: (e: MarkerEventResult) => void): void;
  }

  interface MarkerOptions {
    position?: [number, number];
    offset?: Pixel;
    icon?: Icon | string;
    content?: string | HTMLElement;
    title?: string;
    anchor?: string;
    clickable?: boolean;
    draggable?: boolean;
    zIndex?: number;
    extData?: unknown;
  }

  interface MarkerEventResult {
    lnglat: LngLat;
    pixel: Pixel;
    type: string;
    target: Marker;
  }

  class Icon {
    constructor(options?: IconOptions);
  }

  interface IconOptions {
    size?: Size;
    image?: string;
    imageSize?: Size;
    imageOffset?: Pixel;
  }

  type Content = string | HTMLElement;

  class Polyline {
    constructor(options?: PolylineOptions);
    setPath(path: [number, number][]): void;
    getPath(): [number, number][];
    setOptions(options: PolylineOptions): void;
    hide(): void;
    show(): void;
  }

  interface PolylineOptions {
    path?: [number, number][];
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
    strokeDasharray?: number[];
    lineJoin?: 'miter' | 'round' | 'bevel';
    lineCap?: 'butt' | 'round' | 'square';
    zIndex?: number;
    showDir?: boolean;
    geodesic?: boolean;
    isOutline?: boolean;
    outlineColor?: string;
    borderWeight?: number;
    extData?: unknown;
  }

  class Polygon {
    constructor(options?: PolygonOptions);
    setPath(path: [number, number][] | [number, number][][]): void;
    getPath(): [number, number][];
    setOptions(options: PolygonOptions): void;
  }

  interface PolygonOptions {
    path?: [number, number][] | [number, number][][];
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
    zIndex?: number;
    extData?: unknown;
  }

  class Circle {
    constructor(options?: CircleOptions);
    setCenter(center: [number, number]): void;
    setRadius(radius: number): void;
    getCenter(): LngLat;
    getRadius(): number;
  }

  interface CircleOptions {
    center?: [number, number];
    radius?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
    zIndex?: number;
    extData?: unknown;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(map: Map, position: [number, number]): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
    setPosition(position: [number, number]): void;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    position?: [number, number];
    offset?: Pixel;
    anchor?: string;
    isCustom?: boolean;
    autoMove?: boolean;
    closeWhenClickMap?: boolean;
    size?: Size;
  }

  class Layer {}

  class PlaceSearch {
    constructor(options?: PlaceSearchOptions);
    search(keyword: string, callback: (status: string, result: PlaceSearch.SearchResult) => void): void;
    searchNearBy(keyword: string, center: [number, number], radius: number, callback: (status: string, result: PlaceSearch.SearchResult) => void): void;
  }

  interface PlaceSearchOptions {
    city?: string;
    type?: string;
    pageSize?: number;
    pageIndex?: number;
    extensions?: 'base' | 'all';
  }

  namespace PlaceSearch {
    interface SearchResult {
      info: string;
      count: number;
      poiList: {
        count: number;
        pageIndex: number;
        pageSize: number;
        pois: POI[];
      };
    }

    interface POI {
      id: string;
      name: string;
      type: string;
      typecode: string;
      address: string;
      location: LngLat;
      tel: string;
      distance: number;
      pname: string;
      cityname: string;
      adname: string;
    }
  }

  class Geocoder {
    constructor(options?: GeocoderOptions);
    getLocation(address: string, callback: (status: string, result: Geocoder.GeocodeResult) => void): void;
    getAddress(location: [number, number], callback: (status: string, result: Geocoder.ReGeocodeResult) => void): void;
  }

  interface GeocoderOptions {
    city?: string;
    radius?: number;
    extensions?: 'base' | 'all';
  }

  namespace Geocoder {
    interface GeocodeResult {
      info: string;
      geocodes: Array<{
        formattedAddress: string;
        location: LngLat;
        adcode: string;
        level: string;
      }>;
    }

    interface ReGeocodeResult {
      info: string;
      regeocode: {
        formattedAddress: string;
        addressComponent: {
          province: string;
          city: string;
          district: string;
          street: string;
          streetNumber: string;
          neighborhood: string;
          building: string;
          adcode: string;
          citycode: string;
        };
        pois: POI[];
      };
    }

    interface POI {
      id: string;
      name: string;
      type: string;
      address: string;
      location: LngLat;
      distance: number;
    }
  }

  class Geolocation {
    constructor(options?: GeolocationOptions);
    getCurrentPosition(callback: (status: string, result: Geolocation.GeolocationResult) => void): void;
    watchPosition(): number;
    clearWatch(watchId: number): void;
  }

  interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    convert?: boolean;
    showButton?: boolean;
    buttonPosition?: string;
    showMarker?: boolean;
    showCircle?: boolean;
    panToLocation?: boolean;
    zoomToAccuracy?: boolean;
    GeoLocationFirst?: boolean;
    noIpLocate?: boolean;
    noGeoLocation?: boolean;
    useNative?: boolean;
    getCityWhenFail?: boolean;
    needAddress?: boolean;
    extensions?: 'base' | 'all';
  }

  namespace Geolocation {
    interface GeolocationResult {
      position: LngLat;
      accuracy: number;
      location_type: string;
      message: string;
      isConverted: boolean;
      info: string;
      addressComponent: {
        province: string;
        city: string;
        district: string;
        street: string;
        streetNumber: string;
        neighborhood: string;
        building: string;
        adcode: string;
        citycode: string;
      };
      formattedAddress: string;
      pois: Array<{
        id: string;
        name: string;
        type: string;
        address: string;
        distance: number;
      }>;
      roads: Array<{
        id: string;
        name: string;
        distance: number;
        direction: string;
        location: LngLat;
      }>;
    }
  }
}

export {};



