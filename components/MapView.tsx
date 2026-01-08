'use client';

import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { useAppStore, useSelectedPlan } from '@/store/useAppStore';
import { loadAMapScript, coordinateToArray, fitMapView } from '@/lib/amap';
import { Coordinate } from '@/types';

/** 地图组件 Props */
interface MapViewProps {
  onMapClick?: (coordinate: Coordinate) => void;
}

/** 地图组件 */
const MapView: React.FC<MapViewProps> = memo(function MapView({ onMapClick }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMap.Map | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]);
  const polylinesRef = useRef<AMap.Polyline[]>([]);
  const meetingMarkerRef = useRef<AMap.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const { participants, hoveredParticipantId, searchCenter } = useAppStore();
  const selectedPlan = useSelectedPlan();

  // 初始化地图
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        await loadAMapScript();
        if (!isMounted || !containerRef.current || mapRef.current) return;

        mapRef.current = new AMap.Map(containerRef.current, {
          zoom: 12,
          center: [116.397428, 39.90923], // 默认北京
          viewMode: '2D',
          mapStyle: 'amap://styles/normal',
        });

        // 等待地图完全初始化
        mapRef.current.on('complete', () => {
          setIsMapReady(true);
        });

        // 点击事件
        if (onMapClick) {
          mapRef.current.on('click', (e: AMap.MapEventResult) => {
            // 高德地图 LngLat 对象可能需要使用方法或属性获取值
            const lnglat = e.lnglat;
            const lng = typeof lnglat.getLng === 'function' ? lnglat.getLng() : lnglat.lng;
            const lat = typeof lnglat.getLat === 'function' ? lnglat.getLat() : lnglat.lat;
            
            // 验证坐标有效性
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
              onMapClick({ lng, lat });
            } else {
              console.warn('地图点击坐标无效:', lnglat);
            }
          });
        }
      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      setIsMapReady(false);
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [onMapClick]);

  // 清除所有标记和路线
  const clearOverlays = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // 清除参与者标记
    markersRef.current.forEach((marker) => map.remove(marker));
    markersRef.current = [];

    // 清除路线
    polylinesRef.current.forEach((polyline) => map.remove(polyline));
    polylinesRef.current = [];

    // 清除集合点标记
    if (meetingMarkerRef.current) {
      map.remove(meetingMarkerRef.current);
      meetingMarkerRef.current = null;
    }
  }, []);

  // 更新参与者标记
  const updateParticipantMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // 清除旧标记
    markersRef.current.forEach((marker) => map.remove(marker));
    markersRef.current = [];

    // 添加新标记
    const coordinates: Coordinate[] = [];
    participants.forEach((participant, index) => {
      if (!participant.location) return;

      const coord = participant.location.coordinate;
      // 验证坐标有效性
      if (!coord || typeof coord.lng !== 'number' || typeof coord.lat !== 'number' || 
          isNaN(coord.lng) || isNaN(coord.lat)) {
        console.warn('参与者坐标无效:', participant.name, coord);
        return;
      }
      coordinates.push(coord);

      // 创建标记 SVG
      const svg = `
        <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.059 0 0 8.059 0 18c0 9.941 18 26 18 26s18-16.059 18-26C36 8.059 27.941 0 18 0z" fill="${participant.color}"/>
          <circle cx="18" cy="16" r="8" fill="white"/>
          <text x="18" y="20" text-anchor="middle" fill="${participant.color}" font-size="11" font-weight="bold">${index + 1}</text>
        </svg>
      `;

      try {
        const position = coordinateToArray(coord);
        const marker = new AMap.Marker({
          position,
          offset: new AMap.Pixel(-18, -44),
          content: `<div style="transform: scale(${hoveredParticipantId === participant.id ? 1.2 : 1}); transition: transform 0.2s;">${svg}</div>`,
          title: participant.name,
          extData: { id: participant.id },
        });

        map.add(marker);
        markersRef.current.push(marker);
      } catch (error) {
        console.error('创建标记失败:', participant.name, coord, error);
      }
    });

    // 调整视野
    if (coordinates.length > 0 && !selectedPlan) {
      fitMapView(map, coordinates);
    }
  }, [participants, hoveredParticipantId, selectedPlan, isMapReady]);

  // 更新路线和集合点
  const updateRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    // 清除旧路线
    polylinesRef.current.forEach((polyline) => map.remove(polyline));
    polylinesRef.current = [];

    // 清除旧集合点标记
    if (meetingMarkerRef.current) {
      map.remove(meetingMarkerRef.current);
      meetingMarkerRef.current = null;
    }

    if (!selectedPlan) return;

    // 添加路线
    const allCoordinates: Coordinate[] = [];
    selectedPlan.routes.forEach((route) => {
      const participant = participants.find((p) => p.id === route.participantId);
      if (!participant || route.path.length === 0) return;

      try {
        // 过滤有效路径点
        const validPath = route.path.filter(
          (coord) => coord && typeof coord.lng === 'number' && typeof coord.lat === 'number' &&
                     !isNaN(coord.lng) && !isNaN(coord.lat)
        );
        if (validPath.length === 0) return;
        
        const path = validPath.map(coordinateToArray);
        allCoordinates.push(...validPath);

        const isHovered = hoveredParticipantId === route.participantId;
        const polyline = new AMap.Polyline({
          path,
          strokeColor: participant.color,
          strokeWeight: isHovered ? 8 : 5,
          strokeOpacity: isHovered ? 1 : 0.7,
          lineJoin: 'round',
          lineCap: 'round',
        });

        map.add(polyline);
        polylinesRef.current.push(polyline);
      } catch (error) {
        console.error('创建路线失败:', participant.name, error);
      }
    });

    // 添加集合点标记
    const poi = selectedPlan.poi;
    const poiCoord = poi.location.coordinate;
    // 验证集合点坐标有效性
    if (!poiCoord || typeof poiCoord.lng !== 'number' || typeof poiCoord.lat !== 'number' ||
        isNaN(poiCoord.lng) || isNaN(poiCoord.lat)) {
      console.warn('集合点坐标无效:', poi.name, poiCoord);
      return;
    }
    
    try {
      const meetingSvg = `
        <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 0C10.745 0 0 10.745 0 24c0 13.255 24 32 24 32s24-18.745 24-32C48 10.745 37.255 0 24 0z" fill="#FF6B35"/>
          <circle cx="24" cy="22" r="12" fill="white"/>
          <text x="24" y="27" text-anchor="middle" fill="#FF6B35" font-size="16">★</text>
        </svg>
      `;

      meetingMarkerRef.current = new AMap.Marker({
        position: coordinateToArray(poiCoord),
        offset: new AMap.Pixel(-24, -56),
        content: meetingSvg,
        title: poi.name,
        zIndex: 200,
      });

      map.add(meetingMarkerRef.current);
      allCoordinates.push(poiCoord);
    } catch (error) {
      console.error('创建集合点标记失败:', poi.name, poiCoord, error);
    }

    // 调整视野包含所有点
    const participantCoords = participants
      .filter((p) => p.location)
      .map((p) => p.location!.coordinate);
    fitMapView(map, [...participantCoords, poiCoord]);
  }, [selectedPlan, participants, hoveredParticipantId, isMapReady]);

  // 监听数据变化
  useEffect(() => {
    updateParticipantMarkers();
  }, [updateParticipantMarkers]);

  useEffect(() => {
    updateRoutes();
  }, [updateRoutes]);

  // 搜索中心标记
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchCenter) return;

    // 可以添加搜索中心的标记（可选）
  }, [searchCenter]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
});

export default MapView;
