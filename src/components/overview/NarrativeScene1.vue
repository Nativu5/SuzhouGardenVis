<script setup lang="ts">
/**
 * 叙事场景1（强化版）：空间集中与遗产核心
 * 核心观点：园林与高等级遗产高度集中在古城核心区，集中度远高于面积与人口占比，形成"单极核心"
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import HeatmapMatrixChart from '@/components/charts/HeatmapMatrixChart.vue'
import ScatterChart from '@/components/charts/ScatterChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  generateDistrictHeritageLevelMatrix,
  calculateHighLevelHeritageRatio
} from '@/utils/chartDataProcessor'
import {
  getDistrictColor,
  getHeritageLevelColor,
  getOpenStatusColor
} from '@/config/theme'

const store = useGardenStore()

// 使用过滤后的数据
const data = computed(() => store.filteredData)

// 世界遗产园林列表
const worldHeritageGardens = computed(() => {
  return data.value
    .filter(item => item.isWorldHeritage)
    .sort((a, b) => a.district.localeCompare(b.district))
})

// 区县×文保级别矩阵热力图数据
const districtHeritageLevelMatrix = computed(() => {
  return generateDistrictHeritageLevelMatrix(data.value)
})

// 园林占比/面积占比比值（集中度比值）
const concentrationRatio = computed(() => {
  const totalGardens = data.value.length
  const totalArea = store.districtData.reduce((sum, d) => sum + d.area, 0)

  const result = store.districtStatistics
    .map(districtStat => {
      const district = store.districtData.find(d => d.name === districtStat.name)
      if (!district || !totalArea) return null

      const gardenRatio = districtStat.gardenCount / totalGardens
      const areaRatio = district.area / totalArea
      const ratio = areaRatio > 0 ? gardenRatio / areaRatio : 0

      return {
        name: districtStat.name,
        value: parseFloat(ratio.toFixed(2)),
        gardenRatio: gardenRatio * 100,
        areaRatio: areaRatio * 100
      }
    })
    .filter(item => item !== null && item.value > 0)
    .sort((a, b) => a!.name.localeCompare(b!.name, 'zh-CN')) as Array<{
      name: string
      value: number
      gardenRatio: number
      areaRatio: number
    }>

  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 核心区结构散点图数据
const coreDistrictScatter = computed(() => {
  const scatterData = store.districtStatistics
    .filter(district => district.gardenCount > 0)
    .map(district => {
      const highLevelCount = data.value.filter(
        item => item.district === district.name &&
        (item.heritageLevel === '全国' || item.heritageLevel === '省级')
      ).length
      const highLevelRatio = district.gardenCount > 0
        ? (highLevelCount / district.gardenCount) * 100
        : 0

      return {
        name: district.name,
        x: district.gardenDensity,
        y: highLevelRatio,
        size: district.gardenCount,
        color: getOpenStatusColor('开放'),
        category: district.name,
        openRate: district.openRate
      }
    })

  return scatterData
})

// 文保等级构成（区县×文保级别堆叠柱状图）
const heritageLevelComposition = computed(() => {
  // 复用已有的矩阵数据生成函数
  const matrixResult = generateDistrictHeritageLevelMatrix(data.value)

  // 转换为堆叠柱状图需要的格式
  return {
    categories: matrixResult.xCategories, // 区县
    series: matrixResult.yCategories.map(level => ({
      name: level,
      data: matrixResult.xCategories.map(district => {
        const item = matrixResult.matrixData.find(
          d => d.xCategory === district && d.yCategory === level
        )
        return item ? item.value : 0
      }),
      color: getHeritageLevelColor(level)
    }))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const heritageCount = worldHeritageGardens.value.length
  const highLevelRatio = calculateHighLevelHeritageRatio(data.value)

  // 计算姑苏区的集中度比值
  const gususRatio = concentrationRatio.value.data.find(item => item.name === '姑苏区')

  return {
    totalCount,
    heritageCount,
    highLevelRatio: highLevelRatio.toFixed(1) + '%',
    concentrationRatio: gususRatio ? `姑苏区 ${gususRatio.value.toFixed(0)}x` : '-'
  }
})

// 关键结论数据
const keyInsights = computed(() => {
  const gususStat = store.districtStatistics.find(d => d.name === '姑苏区')
  const gususDistrict = store.districtData.find(d => d.name === '姑苏区')
  const totalArea = store.districtData.reduce((sum, d) => sum + d.area, 0)

  if (!gususStat || !gususDistrict) {
    return {
      gususGardenRatio: '51.9%',
      gususAreaRatio: '1.0%',
      concentrationRatio: '52',
      worldHeritageLocation: '姑苏区'
    }
  }

  const gardenRatio = ((gususStat.gardenCount / data.value.length) * 100).toFixed(1)
  const areaRatio = ((gususDistrict.area / totalArea) * 100).toFixed(1)
  const ratio = (parseFloat(gardenRatio) / parseFloat(areaRatio)).toFixed(0)

  return {
    gususGardenRatio: gardenRatio + '%',
    gususAreaRatio: areaRatio + '%',
    concentrationRatio: ratio,
    worldHeritageLocation: '姑苏区'
  }
})

// 判断是否有筛选条件生效
const hasActiveFilters = computed(() => {
  const filters = store.filters
  return !!(
    filters.searchKeyword ||
    (filters.districts && filters.districts.length > 0) ||
    (filters.openStatus && filters.openStatus.length > 0) ||
    (filters.heritageLevels && filters.heritageLevels.length > 0) ||
    (filters.ownershipTypes && filters.ownershipTypes.length > 0) ||
    (filters.currentUses && filters.currentUses.length > 0) ||
    (filters.isWorldHeritage !== null && filters.isWorldHeritage !== undefined) ||
    (filters.constructionPeriods && filters.constructionPeriods.length > 0) ||
    (filters.eraCategories && filters.eraCategories.length > 0) ||
    (filters.publicationBatches && filters.publicationBatches.length > 0) ||
    (filters.areaRanges && filters.areaRanges.length > 0) ||
    (filters.areaMin !== undefined && filters.areaMin !== null) ||
    (filters.areaMax !== undefined && filters.areaMax !== null)
  )
})

/**
 * Tooltip formatters
 */

// 集中度比值 tooltip
const concentrationRatioTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return ''
  const param = params[0]
  const districtName = param.name
  const data = concentrationRatio.value.data.find(item => item.name === districtName)

  if (!data) return ''

  const filterHint = hasActiveFilters.value
    ? `（基于筛选的${store.filteredData.length}座园林）`
    : `（基于全部${store.rawData.length}座园林）`

  return `
    <div style="padding: 8px; min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">集中度比值：</span>
          <span style="font-weight: 600; color: #EE6666;">${data.value}x</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">园林占比：</span>
          <span style="font-weight: 600; color: #5470C6;">${data.gardenRatio.toFixed(1)}%</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">面积占比：</span>
          <span style="font-weight: 600; color: #91CC75;">${data.areaRatio.toFixed(1)}%</span>
        </div>
      </div>
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #F3F4F6; font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `
}

// 核心区结构散点图 tooltip
const coreScatterTooltipFormatter = (params: any) => {
  if (!params || !params.data?.rawData) return ''
  const item = params.data.rawData

  return `
    <div style="padding: 8px; min-width: 180px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${item.name}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">园林密度：</span>
          <span style="font-weight: 600; color: #5470C6;">${item.x.toFixed(2)} 个/km²</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">高等级占比：</span>
          <span style="font-weight: 600; color: #EE6666;">${item.y.toFixed(1)}%</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">园林数量：</span>
          <span style="font-weight: 600; color: #FAC858;">${item.size} 座</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">开放率：</span>
          <span style="font-weight: 600; color: #91CC75;">${item.openRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `
}
</script>

<template>
  <div class="narrative-scene-1 p-6">
    <!-- 场景标题与核心观点 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        空间集中与遗产核心
      </h2>
      <div class="text-sm text-gray-600 mb-4">
        <strong>核心观点：</strong>园林与高等级遗产高度集中在古城核心区，集中度远高于面积与人口占比，形成"单极核心"。
      </div>

      <!-- 阅读路径提示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>阅读路径：</strong>
        先看"集中度比值"，再看"核心区结构散点"，最后查"遗产清单"
      </div>
    </div>

    <!-- 关键结论条 -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="bg-linear-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
        <div class="text-xs text-red-600 font-medium mb-1">空间集中度</div>
        <div class="text-lg font-bold text-red-800">
          姑苏区占地约 {{ keyInsights.gususAreaRatio }}，却拥有 {{ keyInsights.gususGardenRatio }} 园林
        </div>
        <div class="text-xs text-red-600 mt-1">集中度比值约 {{ keyInsights.concentrationRatio }}</div>
      </div>
      <div class="bg-linear-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
        <div class="text-xs text-yellow-600 font-medium mb-1">遗产核心</div>
        <div class="text-lg font-bold text-yellow-800">
          世界遗产全部分布于{{ keyInsights.worldHeritageLocation }}
        </div>
        <div class="text-xs text-yellow-600 mt-1">遗产核心高度单极化</div>
      </div>
      <div class="bg-linear-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
        <div class="text-xs text-green-600 font-medium mb-1">高等级遗产</div>
        <div class="text-lg font-bold text-green-800">
          核心区高等级遗产占比显著更高
        </div>
        <div class="text-xs text-green-600 mt-1">全国+省级占比 {{ metrics.highLevelRatio }}</div>
      </div>
    </div>

    <!-- KPI 指标卡 -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="园林总数"
        :value="metrics.totalCount"
        unit="座"
      />
      <MetricCard
        title="世界遗产"
        :value="metrics.heritageCount"
        unit="座"
      />
      <MetricCard
        title="高等级占比"
        :value="metrics.highLevelRatio"
      />
      <MetricCard
        title="最高集中度"
        :value="metrics.concentrationRatio"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 区县×文保级别矩阵热力图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <HeatmapMatrixChart
          title="区县×文保级别热力矩阵"
          :data="districtHeritageLevelMatrix.matrixData"
          :x-categories="districtHeritageLevelMatrix.xCategories"
          :y-categories="districtHeritageLevelMatrix.yCategories"
          x-axis-name="区县"
          y-axis-name="文保级别"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：色深 = 数量；鼠标悬停显示区县内占比
        </div>
      </div>

      <!-- 园林占比/面积占比比值条形图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县集中度比值"
          :data="concentrationRatio.data"
          :colors="concentrationRatio.colors"
          x-axis-name="区县"
          y-axis-name="集中度比值"
          height="400px"
          :tooltip-formatter="concentrationRatioTooltipFormatter"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：集中度比值 = 园林占比 ÷ 面积占比；比值越高，集中度越高
        </div>
      </div>

      <!-- 核心区结构散点图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <ScatterChart
          title="核心区结构散点图"
          :data="coreDistrictScatter"
          x-axis-name="园林密度 (个/km²)"
          y-axis-name="高等级占比 (%)"
          height="400px"
          :show-legend="false"
          :tooltip-formatter="coreScatterTooltipFormatter"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：气泡大小 = 园林数量；高等级 = 全国+省级
        </div>
      </div>

      <!-- 区县×文保等级堆叠柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="区县×文保等级构成"
          :categories="heritageLevelComposition.categories"
          :series="heritageLevelComposition.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：展示各区县不同文保级别园林的分布情况
        </div>
      </div>
    </div>

    <!-- 世界遗产园林清单表格 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        世界遗产园林清单
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                区县
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                文保级别
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                开放情况
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                面积 (㎡)
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="garden in worldHeritageGardens"
              :key="garden.name"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ garden.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.district }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.heritageLevel }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="{
                    'text-green-600': garden.openStatus === '开放',
                    'text-yellow-600': garden.openStatus === '半开放',
                    'text-red-600': garden.openStatus === '不开放'
                  }"
                >
                  {{ garden.openStatus }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.area.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="worldHeritageGardens.length === 0" class="text-center py-8 text-gray-500">
        暂无世界遗产园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
