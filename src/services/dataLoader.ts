/**
 * 数据加载与清洗服务
 */

import Papa from 'papaparse'
import type { GardenRawData, GardenData, AreaRangeConfig, EraCategoryConfig } from '@/types'

// ==================== 配置常量 ====================

/**
 * 年代分类配置
 */
const ERA_CATEGORIES: EraCategoryConfig[] = [
  { label: '宋代及以前', keywords: ['宋', '唐', '南北朝', '汉', '秦'] },
  { label: '元代', keywords: ['元'] },
  { label: '明代', keywords: ['明'] },
  { label: '清代', keywords: ['清'] },
  { label: '民国', keywords: ['民国'] },
  { label: '现代', keywords: ['1949', '1950', '现代', '当代'] },
  { label: '不详', keywords: [] } // 兜底分类
]

/**
 * 面积区间配置（单位：㎡）
 */
const AREA_RANGES: AreaRangeConfig[] = [
  { label: '0-1000', min: 0, max: 1000 },
  { label: '1000-3000', min: 1000, max: 3000 },
  { label: '3000-5000', min: 3000, max: 5000 },
  { label: '5000-10000', min: 5000, max: 10000 },
  { label: '10000-20000', min: 10000, max: 20000 },
  { label: '20000以上', min: 20000, max: Infinity }
]

// ==================== 数据清洗函数 ====================

/**
 * 清洗面积字段：提取数值
 */
function cleanArea(areaStr: string): number {
  if (!areaStr || areaStr.trim() === '') return 0

  // 移除所有非数字和小数点字符，保留数字和小数点
  const numStr = areaStr.replace(/[^\d.]/g, '')
  const num = parseFloat(numStr)

  return isNaN(num) ? 0 : num
}

/**
 * 清洗文保单位级别：空值归为"未定级"
 */
function cleanHeritageLevel(level: string): string {
  if (!level || level.trim() === '' || level === 'null' || level === 'undefined') {
    return '未定级'
  }
  return level.trim()
}

/**
 * 清洗世界遗产字段：转为布尔值
 */
function cleanWorldHeritage(value: string): boolean {
  if (!value) return false
  const normalized = value.trim().toUpperCase()
  return normalized === 'TRUE' || normalized === 'YES' || normalized === '是' || normalized === '1'
}

/**
 * 清洗经纬度：转为数值
 */
function cleanCoordinate(coord: string): number {
  if (!coord || coord.trim() === '') return 0
  const num = parseFloat(coord)
  return isNaN(num) ? 0 : num
}

/**
 * 计算建造年代分类
 */
function calculateEraCategory(constructionPeriod: string): string {
  if (!constructionPeriod || constructionPeriod.trim() === '') {
    return '不详'
  }

  // 遍历年代分类配置，查找匹配的关键词
  for (const config of ERA_CATEGORIES) {
    if (config.keywords.length === 0) continue // 跳过兜底分类

    for (const keyword of config.keywords) {
      if (constructionPeriod.includes(keyword)) {
        return config.label
      }
    }
  }

  return '不详'
}

/**
 * 计算面积区间
 */
function calculateAreaRange(area: number): string {
  if (area <= 0) return '未知'

  for (const range of AREA_RANGES) {
    if (area >= range.min && area < range.max) {
      return range.label
    }
  }

  return '未知'
}

/**
 * 将原始数据转换为清洗后的数据
 */
function transformGardenData(raw: GardenRawData): GardenData {
  const area = cleanArea(raw['面积（㎡）'])
  const constructionPeriod = raw.建造年代?.trim() || ''

  return {
    // 原始字段映射
    publicationBatch: raw.公布批次?.trim() || '',
    name: raw.名称?.trim() || '',
    district: raw.区县?.trim() || '',
    address: raw.地址?.trim() || '',
    constructionPeriod,
    area,
    ownershipType: raw.权属性质?.trim() || '',
    managementUnit: raw.管理单位?.trim() || '',
    protectionStatus: raw.保护状况?.trim() || '',
    openStatus: raw.开放情况?.trim() || '',
    currentUse: raw.当前用途?.trim() || '',
    description: raw.描述?.trim() || '',
    longitude: cleanCoordinate(raw.经度),
    latitude: cleanCoordinate(raw.纬度),
    heritageLevel: cleanHeritageLevel(raw.文保单位级别),
    isWorldHeritage: cleanWorldHeritage(raw.世界遗产),

    // 派生字段
    eraCategory: calculateEraCategory(constructionPeriod),
    areaRange: calculateAreaRange(area)
  }
}

// ==================== 数据加载主函数 ====================

/**
 * 加载并解析 CSV 数据
 * @param csvPath CSV 文件路径（默认为 /dataset/SuzhouGardenListFull.csv）
 * @returns Promise<GardenData[]>
 */
export async function loadGardenData(
  csvPath: string = '/dataset/SuzhouGardenListFull.csv'
): Promise<GardenData[]> {
  try {
    // 使用 fetch 加载 CSV 文件
    const response = await fetch(csvPath)

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    // 使用 PapaParse 解析 CSV
    return new Promise((resolve, reject) => {
      Papa.parse<GardenRawData>(csvText, {
        header: true, // 第一行作为表头
        skipEmptyLines: true, // 跳过空行
        transformHeader: (header) => header.trim(), // 清理表头空格
        complete: (results) => {
          try {
            // 清洗并转换数据
            const cleanedData = results.data.map(transformGardenData)

            console.log(`✅ 成功加载 ${cleanedData.length} 条园林数据`)
            resolve(cleanedData)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        }
      })
    })
  } catch (error) {
    console.error('❌ 数据加载失败:', error)
    throw error
  }
}

/**
 * 获取所有唯一的区县列表
 */
export function getDistrictList(data: GardenData[]): string[] {
  const districts = new Set(data.map(d => d.district).filter(Boolean))
  return Array.from(districts).sort()
}

/**
 * 获取所有唯一的开放情况列表
 */
export function getOpenStatusList(data: GardenData[]): string[] {
  const statuses = new Set(data.map(d => d.openStatus).filter(Boolean))
  return Array.from(statuses).sort()
}

/**
 * 获取所有唯一的文保单位级别列表
 */
export function getHeritageLevelList(data: GardenData[]): string[] {
  const levels = new Set(data.map(d => d.heritageLevel).filter(Boolean))
  const order = ['全国', '省级', '市级', '区级', '未定级']
  return Array.from(levels).sort((a, b) => {
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

/**
 * 获取所有唯一的权属性质列表
 */
export function getOwnershipTypeList(data: GardenData[]): string[] {
  const types = new Set(data.map(d => d.ownershipType).filter(Boolean))
  return Array.from(types).sort()
}

/**
 * 获取所有唯一的当前用途列表
 */
export function getCurrentUseList(data: GardenData[]): string[] {
  const uses = new Set(data.map(d => d.currentUse).filter(Boolean))
  return Array.from(uses).sort()
}

/**
 * 获取所有唯一的建造年代列表
 */
export function getConstructionPeriodList(data: GardenData[]): string[] {
  const periods = new Set(data.map(d => d.constructionPeriod).filter(Boolean))
  return Array.from(periods).sort()
}

/**
 * 获取所有唯一的年代分类列表
 */
export function getEraCategoryList(data: GardenData[]): string[] {
  const categories = new Set(data.map(d => d.eraCategory).filter(Boolean))
  const order = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '不详']
  return Array.from(categories).sort((a, b) => {
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

/**
 * 获取所有唯一的公布批次列表
 */
export function getPublicationBatchList(data: GardenData[]): string[] {
  const batches = new Set(data.map(d => d.publicationBatch).filter(Boolean))
  return Array.from(batches).sort()
}

/**
 * 获取所有面积区间列表
 */
export function getAreaRangeList(): string[] {
  return AREA_RANGES.map(r => r.label)
}

// 导出配置供其他模块使用
export { AREA_RANGES, ERA_CATEGORIES }
