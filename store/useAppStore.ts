import { create } from 'zustand';
import {
  Participant,
  MeetingPlan,
  Coordinate,
  TransportMode,
  Location,
  POIType,
  CalculateStrategy,
  ScenarioMode,
  CuisineType,
  TastePreference,
} from '@/types';
import { getParticipantColor, generateId } from '@/lib/utils';

/** 应用状态接口 */
interface AppState {
  // 参与者相关
  participants: Participant[];
  addParticipant: () => void;
  removeParticipant: (id: string) => void;
  updateParticipantLocation: (id: string, location: Location) => void;
  updateParticipantTransport: (id: string, mode: TransportMode) => void;
  updateParticipantName: (id: string, name: string) => void;

  // 场景模式
  scenarioMode: ScenarioMode;
  setScenarioMode: (mode: ScenarioMode) => void;

  // 目的地相关
  destination: Location | null;
  setDestination: (location: Location | null) => void;

  // 集合点偏好
  selectedPOITypes: POIType[];
  setSelectedPOITypes: (types: POIType[]) => void;

  // 饮食偏好
  selectedCuisines: CuisineType[];
  setSelectedCuisines: (cuisines: CuisineType[]) => void;
  selectedTastes: TastePreference[];
  setSelectedTastes: (tastes: TastePreference[]) => void;
  minRating: number;
  setMinRating: (rating: number) => void;

  // 计算策略
  strategy: CalculateStrategy;
  setStrategy: (strategy: CalculateStrategy) => void;

  // 计算结果
  isCalculating: boolean;
  calculationProgress: string;
  bestPlan: MeetingPlan | null;
  alternatives: MeetingPlan[];
  searchCenter: Coordinate | null;
  selectedPlanIndex: number;
  setCalculating: (isCalculating: boolean, progress?: string) => void;
  setResults: (
    bestPlan: MeetingPlan,
    alternatives: MeetingPlan[],
    searchCenter: Coordinate
  ) => void;
  clearResults: () => void;
  setSelectedPlanIndex: (index: number) => void;

  // 地图交互
  hoveredParticipantId: string | null;
  setHoveredParticipantId: (id: string | null) => void;

  // 重置
  reset: () => void;
}

/** 创建初始参与者 */
function createParticipant(index: number): Participant {
  return {
    id: generateId(),
    name: `参与者 ${index + 1}`,
    location: null,
    transportMode: 'transit',
    color: getParticipantColor(index),
  };
}

/** 初始状态 */
const initialState = {
  participants: [createParticipant(0), createParticipant(1)],
  scenarioMode: 'meetup' as ScenarioMode,
  destination: null as Location | null,
  selectedPOITypes: ['cafe', 'restaurant'] as POIType[],
  selectedCuisines: ['chinese', 'hotpot'] as CuisineType[],
  selectedTastes: [] as TastePreference[],
  minRating: 0,
  strategy: 'balanced' as CalculateStrategy,
  isCalculating: false,
  calculationProgress: '',
  bestPlan: null,
  alternatives: [],
  searchCenter: null,
  selectedPlanIndex: 0,
  hoveredParticipantId: null,
};

/** Zustand Store */
export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  // 添加参与者
  addParticipant: () => {
    const { participants } = get();
    if (participants.length >= 8) return;
    set({
      participants: [
        ...participants,
        createParticipant(participants.length),
      ],
    });
  },

  // 删除参与者
  removeParticipant: (id: string) => {
    const { participants } = get();
    if (participants.length <= 2) return;
    set({
      participants: participants.filter((p) => p.id !== id),
    });
  },

  // 更新参与者位置
  updateParticipantLocation: (id: string, location: Location) => {
    set({
      participants: get().participants.map((p) =>
        p.id === id ? { ...p, location } : p
      ),
    });
  },

  // 更新参与者交通方式
  updateParticipantTransport: (id: string, mode: TransportMode) => {
    set({
      participants: get().participants.map((p) =>
        p.id === id ? { ...p, transportMode: mode } : p
      ),
    });
  },

  // 更新参与者名称
  updateParticipantName: (id: string, name: string) => {
    set({
      participants: get().participants.map((p) =>
        p.id === id ? { ...p, name } : p
      ),
    });
  },

  // 设置场景模式
  setScenarioMode: (mode: ScenarioMode) => {
    set({ scenarioMode: mode });
  },

  // 设置目的地
  setDestination: (location: Location | null) => {
    set({ destination: location });
  },

  // 设置 POI 类型偏好
  setSelectedPOITypes: (types: POIType[]) => {
    set({ selectedPOITypes: types });
  },

  // 设置菜系偏好
  setSelectedCuisines: (cuisines: CuisineType[]) => {
    set({ selectedCuisines: cuisines });
  },

  // 设置口味偏好
  setSelectedTastes: (tastes: TastePreference[]) => {
    set({ selectedTastes: tastes });
  },

  // 设置最低评分
  setMinRating: (rating: number) => {
    set({ minRating: rating });
  },

  // 设置计算策略
  setStrategy: (strategy: CalculateStrategy) => {
    set({ strategy });
  },

  // 设置计算状态
  setCalculating: (isCalculating: boolean, progress: string = '') => {
    set({ isCalculating, calculationProgress: progress });
  },

  // 设置计算结果
  setResults: (
    bestPlan: MeetingPlan,
    alternatives: MeetingPlan[],
    searchCenter: Coordinate
  ) => {
    set({
      bestPlan,
      alternatives,
      searchCenter,
      selectedPlanIndex: 0,
      isCalculating: false,
      calculationProgress: '',
    });
  },

  // 清除结果
  clearResults: () => {
    set({
      bestPlan: null,
      alternatives: [],
      searchCenter: null,
      selectedPlanIndex: 0,
    });
  },

  // 设置选中的方案索引
  setSelectedPlanIndex: (index: number) => {
    set({ selectedPlanIndex: index });
  },

  // 设置悬停的参与者
  setHoveredParticipantId: (id: string | null) => {
    set({ hoveredParticipantId: id });
  },

  // 重置所有状态
  reset: () => {
    set({
      ...initialState,
      participants: [createParticipant(0), createParticipant(1)],
      scenarioMode: 'meetup',
      destination: null,
      selectedCuisines: ['chinese', 'hotpot'],
      selectedTastes: [],
      minRating: 0,
    });
  },
}));

/** 获取当前选中的方案 */
export function useSelectedPlan(): MeetingPlan | null {
  const { bestPlan, alternatives, selectedPlanIndex } = useAppStore();
  if (selectedPlanIndex === 0) return bestPlan;
  return alternatives[selectedPlanIndex - 1] || null;
}

/** 获取所有有效位置的参与者 */
export function useValidParticipants(): Participant[] {
  const { participants } = useAppStore();
  return participants.filter((p) => p.location !== null);
}

