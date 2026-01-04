<script setup lang="ts">
/**
 * 叙事场景1：空间集中与遗产核心
 * 呈现园林在苏州各区县的集中程度与高等级保护的空间分布
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByDistrict,
  groupAreaByDistrict,
  groupByDistrictAndHeritageLevel,
  calculateRank,
  calculatePercentage,
  formatNumber,
  formatRank
} from '@/utils/chartDataProcessor'
import {
  getDistrictColor,
  getHeritageLevelColor
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

// 按区县统计园林数量
const gardenCountByDistrict = computed(() => {
  const result = groupByDistrict(data.value)
  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 园林密度对比（个/平方公里）
const gardenDensityByDistrict = computed(() => {
  const result = store.districtStatistics
    .map(district => ({
      name: district.name,
      value: parseFloat(district.gardenDensity.toFixed(2))
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 按区县统计总面积
const gardenAreaByDistrict = computed(() => {
  const result = groupAreaByDistrict(data.value)
  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 按区县×文保级别分层统计
const districtHeritageData = computed(() => {
  const result = groupByDistrictAndHeritageLevel(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getHeritageLevelColor(s.name)
    }))
  }
})

// 文保等级构成
const heritageLevelComposition = computed(() => {
  const levelMap = new Map<string, number>()
  data.value.forEach(item => {
    const level = item.heritageLevel || '未定级'
    levelMap.set(level, (levelMap.get(level) || 0) + 1)
  })
  
  const order = ['全国', '省级', '市级', '县级', '未定级']
  
  const result = Array.from(levelMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
       const indexA = order.indexOf(a.name)
       const indexB = order.indexOf(b.name)
       return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })

  return {
    data: result,
    colors: result.map(item => getHeritageLevelColor(item.name))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const heritageCount = worldHeritageGardens.value.length
  const totalArea = data.value.reduce((sum, item) => sum + item.area, 0)
  const topDistrict = gardenCountByDistrict.value.data[0]

  return {
    totalCount,
    heritageCount,
    totalArea: Math.round(totalArea),
    topDistrict: topDistrict ? `${topDistrict.name} (${topDistrict.value}座)` : '-'
  }
})

/**
 * Tooltip formatters
 */

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

// 园林密度tooltip
const densityTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return ''
  const param = params[0]
  const districtName = param.name
  const density = param.value

  // 计算排名和占比
  const allDensities = gardenDensityByDistrict.value.data.map(d => d.value)
  const rank = calculateRank(density, allDensities)

  const filterHint = hasActiveFilters.value ? `（基于筛选的${data.value.length}座园林）` : `（基于全部${store.rawData.length}座园林）`

  return `
    <div style="padding: 8px; min-width: 180px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">园林密度：</span>
          <span style="font-weight: 600; color: #5470C6;">${density} 个/km²</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">排名：</span>
          <span style="font-weight: 600; color: #F59E0B;">${formatRank(rank)}</span>
        </div>
      </div>
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #F3F4F6; font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `
}

// 园林总面积tooltip
const areaTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return ''
  const param = params[0]
  const districtName = param.name
  const areaValue = param.value

  // 计算总面积和排名
  const totalArea = data.value.reduce((sum, item) => sum + item.area, 0)
  const allAreas = gardenAreaByDistrict.value.data.map(d => d.value)
  const rank = calculateRank(areaValue, allAreas)
  const percentage = calculatePercentage(areaValue, totalArea)

  const filterHint = hasActiveFilters.value ? `（基于筛选的${data.value.length}座园林）` : `（基于全部${store.rawData.length}座园林）`

  return `
    <div style="padding: 8px; min-width: 180px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">总面积：</span>
          <span style="font-weight: 600; color: #5470C6;">${formatNumber(areaValue)} ㎡</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">占全市比：</span>
          <span style="font-weight: 600; color: #10B981;">${percentage}</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">排名：</span>
          <span style="font-weight: 600; color: #F59E0B;">${formatRank(rank)}</span>
        </div>
      </div>
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #F3F4F6; font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `
}
</script>

<template>
  <div class="narrative-scene-1 p-6">
    <!-- 场景标题与说明 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        空间集中与遗产核心
      </h2>
      <p class="text-gray-600">
        呈现园林在苏州各区县的集中程度与高等级保护的空间分布
      </p>
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
        title="总面积"
        :value="metrics.totalArea"
        unit="㎡"
      />
      <MetricCard
        title="园林最多区县"
        :value="metrics.topDistrict"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 区县×文保单位级别分层柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="区县×文保单位级别分布"
          :categories="districtHeritageData.categories"
          :series="districtHeritageData.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
        />
      </div>

      <!-- 园林密度对比图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县园林密度对比"
          :data="gardenDensityByDistrict.data"
          :colors="gardenDensityByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="园林密度 (个/km²)"
          height="400px"
          :tooltip-formatter="densityTooltipFormatter"
        />
      </div>

      <!-- 区县总面积柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县园林总面积"
          :data="gardenAreaByDistrict.data"
          :colors="gardenAreaByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="总面积 (㎡)"
          height="400px"
          :tooltip-formatter="areaTooltipFormatter"
        />
      </div>

      <!-- 文保等级构成 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="文保等级构成"
          :data="heritageLevelComposition.data"
          :colors="heritageLevelComposition.colors"
          x-axis-name="数量"
          y-axis-name="文保级别"
          height="400px"
          :horizontal="true"
        />
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
