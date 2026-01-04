/**
 * 图表数据处理工具函数
 * 用于将园林数据转换为图表所需的格式
 */

import type { GardenData } from '@/types'

/**
 * 按区县分组统计园林数量
 */
export function groupByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, number>()

  data.forEach(item => {
    const count = districtMap.get(item.district) || 0
    districtMap.set(item.district, count + 1)
  })

  return Array.from(districtMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * 按区县统计总面积
 */
export function groupAreaByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, number>()

  data.forEach(item => {
    const area = districtMap.get(item.district) || 0
    districtMap.set(item.district, area + item.area)
  })

  return Array.from(districtMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}

/**
 * 按区县和文保级别分层统计
 */
export function groupByDistrictAndHeritageLevel(data: GardenData[]): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
  const districtSet = new Set<string>()
  const heritageLevelSet = new Set<string>()
  const countMap = new Map<string, number>()

  // 收集所有区县和文保级别
  data.forEach(item => {
    districtSet.add(item.district)
    heritageLevelSet.add(item.heritageLevel)

    const key = `${item.district}|${item.heritageLevel}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const districts = Array.from(districtSet).sort()
  const order = ['全国', '省级', '市级', '县级', '未定级']
  const heritageLevels = Array.from(heritageLevelSet).sort((a, b) => {
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const series = heritageLevels.map(level => ({
    name: level,
    data: districts.map(district => {
      const key = `${district}|${level}`
      return countMap.get(key) || 0
    })
  }))

  return {
    categories: districts,
    series
  }
}

/**
 * 按建造年代分组统计
 */
export function groupByEraCategory(data: GardenData[]): { name: string; value: number }[] {
  const eraMap = new Map<string, number>()

  data.forEach(item => {
    const count = eraMap.get(item.eraCategory) || 0
    eraMap.set(item.eraCategory, count + 1)
  })

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详']
  return Array.from(eraMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const indexA = eraOrder.indexOf(a.name)
      const indexB = eraOrder.indexOf(b.name)
      // 如果找不到，放到最后
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
}

/**
 * 按建造年代和文保级别分层统计
 */
export function groupByEraCategoryAndHeritageLevel(data: GardenData[]): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
  const eraSet = new Set<string>()
  const heritageLevelSet = new Set<string>()
  const countMap = new Map<string, number>()

  data.forEach(item => {
    eraSet.add(item.eraCategory)
    heritageLevelSet.add(item.heritageLevel)

    const key = `${item.eraCategory}|${item.heritageLevel}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详']
  const eras = Array.from(eraSet).sort((a, b) => {
    const indexA = eraOrder.indexOf(a)
    const indexB = eraOrder.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })
  const order = ['全国', '省级', '市级', '县级', '未定级']
  const heritageLevels = Array.from(heritageLevelSet).sort((a, b) => {
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const series = heritageLevels.map(level => ({
    name: level,
    data: eras.map(era => {
      const key = `${era}|${level}`
      return countMap.get(key) || 0
    })
  }))

  return {
    categories: eras,
    series
  }
}

/**
 * 按公布批次和建造年代分层统计
 */
export function groupByBatchAndEraCategory(data: GardenData[]): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
  const batchSet = new Set<string>()
  const eraSet = new Set<string>()
  const countMap = new Map<string, number>()

  data.forEach(item => {
    batchSet.add(item.publicationBatch)
    eraSet.add(item.eraCategory)

    const key = `${item.publicationBatch}|${item.eraCategory}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const batches = Array.from(batchSet).sort()
  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详']
  const eras = Array.from(eraSet).sort((a, b) => {
    const indexA = eraOrder.indexOf(a)
    const indexB = eraOrder.indexOf(b)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const series = eras.map(era => ({
    name: era,
    data: batches.map(batch => {
      const key = `${batch}|${era}`
      return countMap.get(key) || 0
    })
  }))

  return {
    categories: batches,
    series
  }
}

/**
 * 按权属性质和开放情况统计（用于桑基图）
 */
export function groupByOwnershipAndOpenStatus(data: GardenData[]): {
  nodes: { name: string }[]
  links: { source: string; target: string; value: number }[]
} {
  const linkMap = new Map<string, number>()
  const nodeSet = new Set<string>()

  data.forEach(item => {
    nodeSet.add(item.ownershipType)
    nodeSet.add(item.openStatus)

    const key = `${item.ownershipType}|${item.openStatus}`
    const count = linkMap.get(key) || 0
    linkMap.set(key, count + 1)
  })

  const nodes = Array.from(nodeSet).map(name => ({ name }))
  const links = Array.from(linkMap.entries())
    .map(([key, value]) => {
      const parts = key.split('|')
      return { source: parts[0] || '', target: parts[1] || '', value }
    })
    .filter(link => link.value > 0 && link.source && link.target)

  return { nodes, links }
}

/**
 * 按当前用途和开放情况分层统计
 */
export function groupByCurrentUseAndOpenStatus(data: GardenData[]): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
  const useSet = new Set<string>()
  const statusSet = new Set<string>()
  const countMap = new Map<string, number>()

  data.forEach(item => {
    useSet.add(item.currentUse)
    statusSet.add(item.openStatus)

    const key = `${item.currentUse}|${item.openStatus}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const uses = Array.from(useSet).sort()
  const statuses = Array.from(statusSet).sort()

  const series = statuses.map(status => ({
    name: status,
    data: uses.map(use => {
      const key = `${use}|${status}`
      return countMap.get(key) || 0
    })
  }))

  return {
    categories: uses,
    series
  }
}

/**
 * 按区县和开放情况分层统计
 */
export function groupByDistrictAndOpenStatus(data: GardenData[]): {
  categories: string[]
  series: { name: string; data: number[] }[]
} {
  const districtSet = new Set<string>()
  const statusSet = new Set<string>()
  const countMap = new Map<string, number>()

  data.forEach(item => {
    districtSet.add(item.district)
    statusSet.add(item.openStatus)

    const key = `${item.district}|${item.openStatus}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const districts = Array.from(districtSet).sort()
  const statuses = Array.from(statusSet).sort()

  const series = statuses.map(status => ({
    name: status,
    data: districts.map(district => {
      const key = `${district}|${status}`
      return countMap.get(key) || 0
    })
  }))

  return {
    categories: districts,
    series
  }
}

/**
 * 按面积区间和开放情况分层统计
 */
export function groupByAreaRangeAndOpenStatus(data: GardenData[]): {
  intervals: string[]
  series: { name: string; data: number[] }[]
} {
  const rangeSet = new Set<string>()
  const statusSet = new Set<string>()
  const countMap = new Map<string, number>()

  data.forEach(item => {
    rangeSet.add(item.areaRange)
    statusSet.add(item.openStatus)

    const key = `${item.areaRange}|${item.openStatus}`
    const count = countMap.get(key) || 0
    countMap.set(key, count + 1)
  })

  const rangeOrder = ['< 1000', '1000-5000', '5000-10000', '10000-50000', '> 50000']
  const ranges = Array.from(rangeSet).sort((a, b) => rangeOrder.indexOf(a) - rangeOrder.indexOf(b))
  const statuses = Array.from(statusSet).sort()

  const series = statuses.map(status => ({
    name: status,
    data: ranges.map(range => {
      const key = `${range}|${status}`
      return countMap.get(key) || 0
    })
  }))

  return {
    intervals: ranges,
    series
  }
}

/**
 * 按区县统计平均面积
 */
export function groupAverageAreaByDistrict(data: GardenData[]): { name: string; value: number }[] {
  const districtMap = new Map<string, { total: number; count: number }>()

  data.forEach(item => {
    const stats = districtMap.get(item.district) || { total: 0, count: 0 }
    stats.total += item.area
    stats.count += 1
    districtMap.set(item.district, stats)
  })

  return Array.from(districtMap.entries())
    .map(([name, stats]) => ({
      name,
      value: Math.round(stats.total / stats.count)
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * 按建造年代统计平均面积
 */
export function groupAverageAreaByEraCategory(data: GardenData[]): { name: string; value: number }[] {
  const eraMap = new Map<string, { total: number; count: number }>()

  data.forEach(item => {
    const stats = eraMap.get(item.eraCategory) || { total: 0, count: 0 }
    stats.total += item.area
    stats.count += 1
    eraMap.set(item.eraCategory, stats)
  })

  const eraOrder = ['宋代及以前', '元代', '明代', '清代', '民国', '现代', '未知', '不详']
  return Array.from(eraMap.entries())
    .map(([name, stats]) => ({
      name,
      value: Math.round(stats.total / stats.count)
    }))
    .sort((a, b) => {
      const indexA = eraOrder.indexOf(a.name)
      const indexB = eraOrder.indexOf(b.name)
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
}

/**
 * ============================================
 * Tooltip 辅助函数
 * ============================================
 */

/**
 * 计算某个值在数组中的排名（降序）
 * @param value 当前值
 * @param allValues 所有值的数组
 * @returns 排名（1-based）
 */
export function calculateRank(value: number, allValues: number[]): number {
  const sortedValues = [...allValues].sort((a, b) => b - a)
  const rank = sortedValues.indexOf(value) + 1
  return rank > 0 ? rank : allValues.length
}

/**
 * 计算占比百分数
 * @param value 当前值
 * @param total 总值
 * @param decimals 保留小数位数，默认1位
 * @returns 百分比字符串，如 "45.6%"
 */
export function calculatePercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(decimals)}%`
}

/**
 * 格式化数值（添加千分位分隔符）
 * @param value 数值
 * @param decimals 保留小数位数，默认0位
 * @returns 格式化后的字符串，如 "1,234.56"
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 生成排名后缀文本
 * @param rank 排名
 * @returns 排名文本，如 "第1位"
 */
export function formatRank(rank: number): string {
  return `第${rank}位`
}

/**
 * 比较值与平均值
 * @param value 当前值
 * @param average 平均值
 * @returns 对比文本，如 "高于平均" / "低于平均" / "等于平均"
 */
export function compareToAverage(value: number, average: number): string {
  const diff = value - average
  if (Math.abs(diff) < 0.01) return '等于平均'
  return diff > 0 ? '高于平均' : '低于平均'
}
