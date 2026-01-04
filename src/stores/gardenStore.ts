/**
 * 园林数据状态管理 Store
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  GardenData,
  Filters,
  ViewMode,
  NarrativeScene,
  SelectionState,
  Statistics,
  DistrictData,
  DistrictStatistics
} from '@/types'
import { loadGardenData, loadDistrictData } from '@/services/dataLoader'

export const useGardenStore = defineStore('garden', () => {
  // ==================== 状态 ====================

  // 原始数据
  const rawData = ref<GardenData[]>([])

  // 行政区划数据
  const districtData = ref<DistrictData[]>([])

  // 加载状态
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // 视图模式
  const viewMode = ref<ViewMode>('overview')

  // 概览模式 - 当前叙事场景
  const overviewNarrative = ref<NarrativeScene>('spatial_heritage')

  // 筛选条件
  const filters = ref<Filters>({})

  // 选中状态
  const selection = ref<SelectionState>({})

  // ==================== 计算属性 ====================

  /**
   * 过滤后的数据
   */
  const filteredData = computed<GardenData[]>(() => {
    let data = rawData.value

    // 搜索关键词
    if (filters.value.searchKeyword) {
      const keyword = filters.value.searchKeyword.toLowerCase()
      data = data.filter(item =>
        item.name.toLowerCase().includes(keyword)
      )
    }

    // 区县筛选
    if (filters.value.districts && filters.value.districts.length > 0) {
      data = data.filter(item =>
        filters.value.districts!.includes(item.district)
      )
    }

    // 开放情况筛选
    if (filters.value.openStatus && filters.value.openStatus.length > 0) {
      data = data.filter(item =>
        filters.value.openStatus!.includes(item.openStatus)
      )
    }

    // 文保单位级别筛选
    if (filters.value.heritageLevels && filters.value.heritageLevels.length > 0) {
      data = data.filter(item =>
        filters.value.heritageLevels!.includes(item.heritageLevel)
      )
    }

    // 权属性质筛选
    if (filters.value.ownershipTypes && filters.value.ownershipTypes.length > 0) {
      data = data.filter(item =>
        filters.value.ownershipTypes!.includes(item.ownershipType)
      )
    }

    // 当前用途筛选
    if (filters.value.currentUses && filters.value.currentUses.length > 0) {
      data = data.filter(item =>
        filters.value.currentUses!.includes(item.currentUse)
      )
    }

    // 世界遗产筛选
    if (filters.value.isWorldHeritage !== null && filters.value.isWorldHeritage !== undefined) {
      data = data.filter(item =>
        item.isWorldHeritage === filters.value.isWorldHeritage
      )
    }

    // 建造年代筛选
    if (filters.value.constructionPeriods && filters.value.constructionPeriods.length > 0) {
      data = data.filter(item =>
        filters.value.constructionPeriods!.includes(item.constructionPeriod)
      )
    }

    // 年代分类筛选
    if (filters.value.eraCategories && filters.value.eraCategories.length > 0) {
      data = data.filter(item =>
        filters.value.eraCategories!.includes(item.eraCategory)
      )
    }

    // 公布批次筛选
    if (filters.value.publicationBatches && filters.value.publicationBatches.length > 0) {
      data = data.filter(item =>
        filters.value.publicationBatches!.includes(item.publicationBatch)
      )
    }

    // 面积区间筛选
    if (filters.value.areaRanges && filters.value.areaRanges.length > 0) {
      data = data.filter(item =>
        filters.value.areaRanges!.includes(item.areaRange)
      )
    }

    // 面积范围筛选（最小值）
    if (filters.value.areaMin !== undefined && filters.value.areaMin !== null) {
      data = data.filter(item => item.area >= filters.value.areaMin!)
    }

    // 面积范围筛选（最大值）
    if (filters.value.areaMax !== undefined && filters.value.areaMax !== null) {
      data = data.filter(item => item.area <= filters.value.areaMax!)
    }

    return data
  })

  /**
   * 统计指标
   */
  const statistics = computed<Statistics>(() => {
    const data = filteredData.value

    const totalCount = data.length
    const openCount = data.filter(item => item.openStatus === '开放').length
    const openRate = totalCount > 0 ? (openCount / totalCount) * 100 : 0
    const worldHeritageCount = data.filter(item => item.isWorldHeritage).length

    const totalArea = data.reduce((sum, item) => sum + item.area, 0)
    const averageArea = totalCount > 0 ? totalArea / totalCount : 0

    return {
      totalCount,
      openCount,
      openRate,
      worldHeritageCount,
      totalArea,
      averageArea
    }
  })

  /**
   * 选中的园林
   */
  const selectedGarden = computed(() => selection.value.selectedGarden)

  /**
   * 选中的区县
   */
  const selectedDistrict = computed(() => selection.value.selectedDistrict)

  /**
   * 区县统计数据（含园林数据）
   */
  const districtStatistics = computed<DistrictStatistics[]>(() => {
    // 使用 filteredData 计算统计（受筛选条件影响）
    const gardens = filteredData.value

    return districtData.value.map(district => {
      // 该区县的所有园林
      const districtGardens = gardens.filter(g => g.district === district.name)
      // 该区县的开放园林
      const openGardens = districtGardens.filter(g => g.openStatus === '开放')

      const gardenCount = districtGardens.length
      const openGardenCount = openGardens.length
      const totalGardenArea = districtGardens.reduce((sum, g) => sum + g.area, 0)
      const openRate = gardenCount > 0 ? (openGardenCount / gardenCount) * 100 : 0

      // 园林密度：个/平方公里
      const gardenDensity = district.area > 0 ? gardenCount / district.area : 0

      // 人均开放园林数：个/万人
      const openGardenPerCapita = district.population > 0 ? openGardenCount / district.population : 0

      return {
        ...district,
        gardenCount,
        openGardenCount,
        totalGardenArea,
        openRate,
        gardenDensity,
        openGardenPerCapita
      }
    })
  })

  // ==================== 操作方法 ====================

  /**
   * 加载数据（园林数据 + 行政区划数据）
   */
  async function loadData() {
    isLoading.value = true
    loadError.value = null

    try {
      // 并行加载园林数据和区划数据
      const [gardenDataResult, districtDataResult] = await Promise.all([
        loadGardenData(),
        loadDistrictData()
      ])

      rawData.value = gardenDataResult
      districtData.value = districtDataResult

      console.log(`✅ Store: 加载了 ${gardenDataResult.length} 条园林数据`)
      console.log(`✅ Store: 加载了 ${districtDataResult.length} 条行政区划数据`)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : '数据加载失败'
      console.error('❌ Store: 数据加载失败', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 设置视图模式
   */
  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  /**
   * 设置概览模式的叙事场景
   */
  function setOverviewNarrative(narrative: NarrativeScene) {
    overviewNarrative.value = narrative
  }

  /**
   * 更新筛选条件
   */
  function updateFilters(newFilters: Partial<Filters>) {
    filters.value = {
      ...filters.value,
      ...newFilters
    }
  }

  /**
   * 清空筛选条件
   */
  function clearFilters() {
    filters.value = {}
  }

  /**
   * 选中园林
   */
  function selectGarden(garden: GardenData | undefined) {
    selection.value.selectedGarden = garden
    // 选中园林时，清除区县选中状态
    if (garden) {
      selection.value.selectedDistrict = undefined
    }
  }

  /**
   * 选中区县
   */
  function selectDistrict(district: string | undefined) {
    selection.value.selectedDistrict = district
    // 选中区县时，清除园林选中状态
    if (district) {
      selection.value.selectedGarden = undefined
    }
  }

  /**
   * 清除选中状态
   */
  function clearSelection() {
    selection.value = {}
  }

  /**
   * 获取指定区县的园林列表
   */
  function getGardensByDistrict(district: string): GardenData[] {
    return filteredData.value.filter(item => item.district === district)
  }

  /**
   * 按名称搜索园林
   */
  function searchGardenByName(keyword: string): GardenData[] {
    if (!keyword) return []
    const normalized = keyword.toLowerCase()
    return rawData.value.filter(item =>
      item.name.toLowerCase().includes(normalized)
    )
  }

  // ==================== 返回 ====================

  return {
    // 状态
    rawData,
    districtData,
    isLoading,
    loadError,
    viewMode,
    overviewNarrative,
    filters,
    selection,

    // 计算属性
    filteredData,
    statistics,
    selectedGarden,
    selectedDistrict,
    districtStatistics,

    // 方法
    loadData,
    setViewMode,
    setOverviewNarrative,
    updateFilters,
    clearFilters,
    selectGarden,
    selectDistrict,
    clearSelection,
    getGardensByDistrict,
    searchGardenByName
  }
})
