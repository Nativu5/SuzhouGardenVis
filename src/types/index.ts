/**
 * 苏州园林数据可视化项目 - TypeScript 类型定义
 */

// ==================== 基础数据类型 ====================

/**
 * 园林原始数据接口（对应 CSV 字段）
 */
export interface GardenRawData {
  公布批次: string
  名称: string
  区县: string
  地址: string
  建造年代: string
  '面积（㎡）': string
  权属性质: string
  管理单位: string
  保护状况: string
  开放情况: string
  当前用途: string
  描述: string
  经度: string
  纬度: string
  文保单位级别: string
  世界遗产: string
}

/**
 * 园林数据接口（清洗后，带派生字段）
 */
export interface GardenData {
  // 原始字段（英文映射）
  publicationBatch: string // 公布批次
  name: string // 名称
  district: string // 区县
  address: string // 地址
  constructionPeriod: string // 建造年代
  area: number // 面积（㎡），数值化
  ownershipType: string // 权属性质
  managementUnit: string // 管理单位
  protectionStatus: string // 保护状况
  openStatus: string // 开放情况
  currentUse: string // 当前用途
  description: string // 描述
  longitude: number // 经度
  latitude: number // 纬度
  heritageLevel: string // 文保单位级别
  isWorldHeritage: boolean // 世界遗产（布尔值）

  // 派生字段
  eraCategory: string // 建造年代分类（如"明代"、"清代"、"民国"等）
  areaRange: string // 面积区间（如"0-1000"、"1000-5000"等）
}

// ==================== 类型与常量 ====================

/**
 * 视图模式
 */
export type ViewMode = 'overview' | 'explore'

/**
 * 叙事场景
 */
export type NarrativeScene =
  | 'spatial_heritage' // 空间集中与遗产核心
  | 'historical_rhythm' // 历史谱系与认定节奏
  | 'accessibility_ownership' // 开放可达与权属/用途
  | 'scale_resources' // 规模结构与资源配置
  | 'protection_risk' // 保护状况与风险提示

/**
 * 叙事场景配置
 */
export interface NarrativeSceneConfig {
  key: NarrativeScene
  title: string // 场景名称
  description: string // 叙事意义/目的
  filters: string[] // 可用筛选器
}

/**
 * 开放情况
 */
export type OpenStatus = '开放' | '未开放' | '部分开放'

/**
 * 文保单位级别
 */
export type HeritageLevel = '全国' | '省级' | '市级' | '区级' | '未定级'

// ==================== 筛选条件 ====================

/**
 * 筛选条件接口
 */
export interface Filters {
  // 搜索
  searchKeyword?: string // 名称关键词搜索

  // 基础维度
  districts?: string[] // 区县（多选）
  openStatus?: string[] // 开放情况（多选）
  heritageLevels?: string[] // 文保单位级别（多选）
  ownershipTypes?: string[] // 权属性质（多选）
  currentUses?: string[] // 当前用途（多选）
  isWorldHeritage?: boolean | null // 世界遗产（true/false/null 表示不筛选）

  // 年代维度
  constructionPeriods?: string[] // 建造年代（多选）
  eraCategories?: string[] // 建造年代分类（多选）
  publicationBatches?: string[] // 公布批次（多选）

  // 面积维度
  areaRanges?: string[] // 面积区间（多选）
  areaMin?: number // 最小面积
  areaMax?: number // 最大面积
}

// ==================== 状态管理 ====================

/**
 * 选中状态
 */
export interface SelectionState {
  selectedGarden?: GardenData // 选中的园林
  selectedDistrict?: string // 选中的区县
}

/**
 * 统计指标
 */
export interface Statistics {
  totalCount: number // 园林总数
  openCount: number // 开放园林数
  openRate: number // 开放率（%）
  worldHeritageCount: number // 世界遗产数
  totalArea: number // 总面积
  averageArea: number // 平均面积
}

// ==================== 图表数据 ====================

/**
 * 通用图表数据项
 */
export interface ChartDataItem {
  name: string
  value: number
  [key: string]: string | number
}

/**
 * 分层柱状图数据项
 */
export interface StackedBarDataItem {
  category: string // 主分类（如区县）
  [key: string]: string | number // 子分类（如文保级别）的值
}

/**
 * 桑基图数据
 */
export interface SankeyData {
  nodes: Array<{ name: string }>
  links: Array<{
    source: string
    target: string
    value: number
  }>
}

// ==================== 工具类型 ====================

/**
 * 加载状态
 */
export interface LoadingState {
  isLoading: boolean
  error?: string
}

/**
 * 面积区间配置
 */
export interface AreaRangeConfig {
  label: string // 显示标签
  min: number // 最小值（包含）
  max: number // 最大值（不包含，最后一个区间为 Infinity）
}

/**
 * 年代分类配置
 */
export interface EraCategoryConfig {
  label: string // 显示标签（如"明代"）
  keywords: string[] // 匹配关键词（如["明"]）
}

// ==================== 行政区划数据 ====================

/**
 * 行政区划原始数据接口（对应 SuzhouDistricts.csv 字段）
 */
export interface DistrictRawData {
  地区: string
  '土地面积(平方公里)': string
  '常住人口(万人)': string
}

/**
 * 行政区划数据接口（清洗后）
 */
export interface DistrictData {
  name: string // 区县名称
  area: number // 土地面积（平方公里）
  population: number // 常住人口（万人）
}

/**
 * 区县统计数据（含园林数据）
 */
export interface DistrictStatistics extends DistrictData {
  gardenCount: number // 园林数量
  openGardenCount: number // 开放园林数量
  totalGardenArea: number // 园林总面积
  openRate: number // 开放率（%）
  gardenDensity: number // 园林密度（个/平方公里）
  openGardenPerCapita: number // 人均开放园林数（个/万人）
}
