'use client';

import React, { useState, useCallback } from 'react';
import type { DeparturePoint, Destination, TravelMode, Coordinate } from '@/types';
import { 
  MapPin, 
  Car, 
  Train, 
  Footprints, 
  Plus, 
  Trash2, 
  Search,
  Loader2,
  User,
  Flag,
  Navigation
} from 'lucide-react';
import { clsx } from 'clsx';

interface LocationInputProps {
  departures: DeparturePoint[];
  destinations: Destination[];
  onAddDeparture: (departure: DeparturePoint) => void;
  onRemoveDeparture: (id: string) => void;
  onUpdateDeparture: (id: string, updates: Partial<DeparturePoint>) => void;
  onAddDestination: (destination: Destination) => void;
  onRemoveDestination: (id: string) => void;
}

// 出行方式配置
const TRAVEL_MODES: { value: TravelMode; label: string; icon: React.ElementType }[] = [
  { value: 'driving', label: '自驾', icon: Car },
  { value: 'transit', label: '公交', icon: Train },
  { value: 'walking', label: '步行', icon: Footprints },
];

// 颜色配置
const DEPARTURE_COLORS = [
  { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
];

// 预设位置（模拟搜索结果）
const PRESET_LOCATIONS = [
  { name: '北京站', address: '北京市东城区毛家湾胡同甲13号', coordinate: { lng: 116.427115, lat: 39.903536 } },
  { name: '北京西站', address: '北京市丰台区莲花池东路118号', coordinate: { lng: 116.322056, lat: 39.894652 } },
  { name: '国贸', address: '北京市朝阳区建国门外大街1号', coordinate: { lng: 116.459819, lat: 39.909652 } },
  { name: '中关村', address: '北京市海淀区中关村大街', coordinate: { lng: 116.310905, lat: 39.982121 } },
  { name: '望京', address: '北京市朝阳区望京街道', coordinate: { lng: 116.480707, lat: 40.002376 } },
  { name: '三里屯', address: '北京市朝阳区三里屯路', coordinate: { lng: 116.454282, lat: 39.933076 } },
  { name: '五道口', address: '北京市海淀区五道口', coordinate: { lng: 116.338112, lat: 39.992552 } },
  { name: '西单', address: '北京市西城区西单北大街', coordinate: { lng: 116.374868, lat: 39.909652 } },
  { name: '天通苑', address: '北京市昌平区天通苑', coordinate: { lng: 116.417301, lat: 40.081589 } },
  { name: '天通苑东', address: '北京市昌平区天通苑东区', coordinate: { lng: 116.432847, lat: 40.077312 } },
  { name: '天通苑北', address: '北京市昌平区天通苑北', coordinate: { lng: 116.418562, lat: 40.091823 } },
  { name: '回龙观', address: '北京市昌平区回龙观', coordinate: { lng: 116.339752, lat: 40.074839 } },
  { name: '西二旗', address: '北京市海淀区西二旗', coordinate: { lng: 116.310316, lat: 40.052094 } },
  { name: '上地', address: '北京市海淀区上地', coordinate: { lng: 116.304142, lat: 40.035573 } },
  { name: '亚运村', address: '北京市朝阳区亚运村', coordinate: { lng: 116.393147, lat: 39.987654 } },
  { name: '奥林匹克公园', address: '北京市朝阳区奥林匹克公园', coordinate: { lng: 116.395645, lat: 40.003817 } },
];

// 目的地颜色配置
const DESTINATION_COLOR = { 
  bg: 'bg-emerald-500', 
  light: 'bg-emerald-100', 
  text: 'text-emerald-600', 
  border: 'border-emerald-300' 
};

type AddingType = 'departure' | 'destination' | null;

const LocationInput: React.FC<LocationInputProps> = ({
  departures,
  destinations,
  onAddDeparture,
  onRemoveDeparture,
  onUpdateDeparture,
  onAddDestination,
  onRemoveDestination,
}) => {
  const [addingType, setAddingType] = useState<AddingType>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newMode, setNewMode] = useState<TravelMode>('driving');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof PRESET_LOCATIONS>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; coordinate: Coordinate } | null>(null);

  // 生成自定义位置的坐标（基于北京中心点随机偏移）
  const generateCustomCoordinate = useCallback((address: string): Coordinate => {
    // 基于地址字符串生成一个相对稳定的坐标
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLng = ((hash % 100) - 50) / 500; // -0.1 到 0.1
    const offsetLat = (((hash * 7) % 100) - 50) / 500;
    return {
      lng: 116.397428 + offsetLng,
      lat: 39.90923 + offsetLat,
    };
  }, []);

  // 搜索位置
  const handleSearch = useCallback((query: string) => {
    setNewAddress(query);
    setSelectedLocation(null);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      const results = PRESET_LOCATIONS.filter(
        loc => loc.name.includes(query) || loc.address.includes(query)
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  }, []);

  // 使用自定义地址
  const handleUseCustomAddress = useCallback(() => {
    if (newAddress.trim().length < 2) return;
    
    const coordinate = generateCustomCoordinate(newAddress);
    setSelectedLocation({
      address: newAddress.trim(),
      coordinate,
    });
    setSearchResults([]);
  }, [newAddress, generateCustomCoordinate]);

  // 选择搜索结果
  const handleSelectLocation = useCallback((location: typeof PRESET_LOCATIONS[0]) => {
    setNewAddress(location.address);
    setSelectedLocation({
      address: location.address,
      coordinate: location.coordinate,
    });
    setSearchResults([]);
    
    // 自动填充名称
    if (!newName) {
      setNewName(location.name);
    }
  }, [newName]);

  // 添加出发点或目的地
  const handleAdd = useCallback(() => {
    if (!newName.trim() || !selectedLocation) return;

    if (addingType === 'departure') {
      const newDeparture: DeparturePoint = {
        id: `dep-${Date.now()}`,
        name: newName.trim(),
        address: selectedLocation.address,
        coordinate: selectedLocation.coordinate,
        travelMode: newMode,
      };
      onAddDeparture(newDeparture);
    } else if (addingType === 'destination') {
      const newDestination: Destination = {
        id: `dest-${Date.now()}`,
        name: newName.trim(),
        address: selectedLocation.address,
        coordinate: selectedLocation.coordinate,
      };
      onAddDestination(newDestination);
    }
    
    // 重置表单
    setNewName('');
    setNewAddress('');
    setNewMode('driving');
    setSelectedLocation(null);
    setAddingType(null);
  }, [newName, selectedLocation, newMode, addingType, onAddDeparture, onAddDestination]);

  // 快速添加预设位置（出发点）
  const handleQuickAddDeparture = useCallback((location: typeof PRESET_LOCATIONS[0]) => {
    const newDeparture: DeparturePoint = {
      id: `dep-${Date.now()}`,
      name: location.name,
      address: location.address,
      coordinate: location.coordinate,
      travelMode: 'driving',
    };
    onAddDeparture(newDeparture);
  }, [onAddDeparture]);

  // 快速添加预设位置（目的地）
  const handleQuickAddDestination = useCallback((location: typeof PRESET_LOCATIONS[0]) => {
    const newDestination: Destination = {
      id: `dest-${Date.now()}`,
      name: location.name,
      address: location.address,
      coordinate: location.coordinate,
    };
    onAddDestination(newDestination);
  }, [onAddDestination]);

  return (
    <div className="space-y-6">
      {/* 出发点区域 */}
      <div className="space-y-4">
        {/* 出发点标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary-500" />
            出发点 ({departures.length}/6)
          </h2>
        </div>

        {/* 已添加的出发点列表 */}
        <div className="space-y-3">
          {departures.map((dep, index) => {
            const color = DEPARTURE_COLORS[index % DEPARTURE_COLORS.length];
            return (
              <div
                key={dep.id}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all duration-200',
                  'bg-white shadow-sm hover:shadow-md',
                  color.border
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  {/* 序号标记 */}
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                    color.bg
                  )}>
                    {index + 1}
                  </div>

                  {/* 信息区域 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{dep.name}</span>
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 truncate">{dep.address}</p>
                    
                    {/* 出行方式选择 */}
                    <div className="flex items-center gap-2 mt-3">
                      {TRAVEL_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = dep.travelMode === mode.value;
                        return (
                          <button
                            key={mode.value}
                            onClick={() => onUpdateDeparture(dep.id, { travelMode: mode.value })}
                            className={clsx(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                              isActive
                                ? `${color.light} ${color.text} font-medium`
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={() => onRemoveDeparture(dep.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 添加出发点按钮 */}
        {departures.length < 6 && addingType !== 'departure' && (
          <button
            onClick={() => setAddingType('departure')}
            className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>添加出发点</span>
          </button>
        )}

        {/* 快速添加出发点 */}
        {departures.length < 6 && addingType === null && (
          <div className="pt-1">
            <p className="text-xs text-slate-500 mb-2">快速添加：</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.slice(0, 4).map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleQuickAddDeparture(loc)}
                  disabled={departures.some(d => d.address === loc.address)}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-full hover:bg-primary-100 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-slate-200" />

      {/* 目的地区域 */}
      <div className="space-y-4">
        {/* 目的地标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-500" />
            目的地 ({destinations.length}/3)
          </h2>
          <span className="text-xs text-slate-400">可选</span>
        </div>

        {/* 已添加的目的地列表 */}
        <div className="space-y-3">
          {destinations.map((dest, index) => (
            <div
              key={dest.id}
              className={clsx(
                'p-4 rounded-xl border-2 transition-all duration-200',
                'bg-white shadow-sm hover:shadow-md',
                DESTINATION_COLOR.border
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                {/* 目的地标记 */}
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                  DESTINATION_COLOR.bg
                )}>
                  <Flag className="w-4 h-4" />
                </div>

                {/* 信息区域 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{dest.name}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{dest.address}</p>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={() => onRemoveDestination(dest.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 添加目的地按钮 */}
        {destinations.length < 3 && addingType !== 'destination' && (
          <button
            onClick={() => setAddingType('destination')}
            className="w-full p-4 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>添加目的地</span>
          </button>
        )}

        {/* 快速添加目的地 */}
        {destinations.length < 3 && addingType === null && (
          <div className="pt-1">
            <p className="text-xs text-slate-500 mb-2">热门目的地：</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.slice(5, 9).map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleQuickAddDestination(loc)}
                  disabled={destinations.some(d => d.address === loc.address)}
                  className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 目的地说明 */}
        {destinations.length === 0 && addingType === null && (
          <p className="text-xs text-slate-400 text-center py-2">
            💡 添加目的地后，系统会推荐方便大家前往目的地的汇合点
          </p>
        )}
      </div>

      {/* 添加表单（出发点或目的地共用） */}
      {addingType !== null && (
        <div className={clsx(
          'p-4 rounded-xl border-2 border-dashed',
          addingType === 'departure' 
            ? 'border-primary-300 bg-primary-50/50' 
            : 'border-emerald-300 bg-emerald-50/50'
        )}>
          <div className="flex items-center gap-2 mb-4">
            {addingType === 'departure' ? (
              <>
                <Navigation className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-primary-700">添加出发点</span>
              </>
            ) : (
              <>
                <Flag className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-emerald-700">添加目的地</span>
              </>
            )}
          </div>
          
          <div className="space-y-4">
            {/* 名称输入 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {addingType === 'departure' ? '谁出发？' : '目的地名称'}
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={addingType === 'departure' ? '输入名称，如：小明' : '输入目的地名称'}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            {/* 地址搜索 */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {addingType === 'departure' ? '从哪出发？' : '目的地在哪？'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="搜索地址或地标"
                  className="w-full px-4 py-2.5 pl-10 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
                )}
              </div>

              {/* 搜索结果下拉 */}
              {(searchResults.length > 0 || (newAddress.length >= 2 && !isSearching)) && !selectedLocation && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                  {searchResults.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <div className="font-medium text-slate-800">{loc.name}</div>
                      <div className="text-sm text-slate-500">{loc.address}</div>
                    </button>
                  ))}
                  {/* 使用自定义地址选项 */}
                  <button
                    onClick={handleUseCustomAddress}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-t border-slate-200 bg-slate-50"
                  >
                    <div className="font-medium text-primary-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      使用「{newAddress}」作为地址
                    </div>
                    <div className="text-sm text-slate-500">系统将自动估算位置</div>
                  </button>
                </div>
              )}
            </div>

            {/* 已选位置提示 */}
            {selectedLocation && (
              <div className={clsx(
                'flex items-center gap-2 text-sm px-3 py-2 rounded-lg',
                addingType === 'departure' 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-emerald-600 bg-emerald-50'
              )}>
                <MapPin className="w-4 h-4" />
                <span>已选择：{selectedLocation.address}</span>
              </div>
            )}

            {/* 出行方式（仅出发点） */}
            {addingType === 'departure' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  怎么去？
                </label>
                <div className="flex gap-2">
                  {TRAVEL_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = newMode === mode.value;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => setNewMode(mode.value)}
                        className={clsx(
                          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                          isActive
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !selectedLocation}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg font-medium transition-colors',
                  'disabled:bg-slate-300 disabled:cursor-not-allowed',
                  addingType === 'departure'
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                )}
              >
                确认添加
              </button>
              <button
                onClick={() => {
                  setAddingType(null);
                  setNewName('');
                  setNewAddress('');
                  setSelectedLocation(null);
                }}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LocationInput);

