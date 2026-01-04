<script setup lang="ts">
/**
 * 叙事场景3：开放可达与权属/用途
 * 解释开放性差异的结构性因素，识别权属与用途对可达性的影响
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import SankeyChart from '@/components/charts/SankeyChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByOwnershipAndOpenStatus,
  groupByCurrentUseAndOpenStatus,
  groupByDistrictAndOpenStatus,
  calculateRank,
  formatRank
} from '@/utils/chartDataProcessor'
import {
  getOpenStatusColor,
  getDistrictColor
} from '@/config/theme'

const store = useGardenStore()

// 使用过滤后的数据
const data = computed(() => store.filteredData)

// 未开放园林列表
const closedGardens = computed(() => {
  return data.value
    .filter(item => item.openStatus === '不开放')
    .sort((a, b) => a.district.localeCompare(b.district))
})

// 权属性质→开放情况桑基图数据
const ownershipOpenSankeyData = computed(() => {
  return groupByOwnershipAndOpenStatus(data.value)
})

// 当前用途×开放情况分层统计
const useOpenData = computed(() => {
  const result = groupByCurrentUseAndOpenStatus(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getOpenStatusColor(s.name)
    }))
  }
})

// 区县×开放情况分层统计
const districtOpenData = computed(() => {
  const result = groupByDistrictAndOpenStatus(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getOpenStatusColor(s.name)
    }))
  }
})

// 区县人均开放资源（个/万人）
const openGardenPerCapitaByDistrict = computed(() => {
  const result = store.districtStatistics
    .map(district => ({
      name: district.name,
      value: parseFloat(district.openGardenPerCapita.toFixed(2))
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const openCount = data.value.filter(item => item.openStatus === '开放').length
  const openRate = totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(1) : '0'
  const closedCount = closedGardens.value.length

  return {
    totalCount,
    openCount,
    openRate: `${openRate}%`,
    closedCount
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

// 人均开放资源tooltip
const perCapitaTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return ''
  const param = params[0]
  const districtName = param.name
  const perCapitaValue = param.value

  // 计算排名
  const allValues = openGardenPerCapitaByDistrict.value.data.map(d => d.value)
  const rank = calculateRank(perCapitaValue, allValues)

  // 计算该区县的平均开放率
  const districtStats = store.districtStatistics.find(d => d.name === districtName)
  const openRate = districtStats ? districtStats.openRate.toFixed(1) : '0'

  const filterHint = hasActiveFilters.value ? `（基于筛选的${data.value.length}座园林）` : `（基于全部${store.rawData.length}座园林）`

  return `
    <div style="padding: 8px; min-width: 180px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">人均开放园林：</span>
          <span style="font-weight: 600; color: #10B981;">${perCapitaValue} 个/万人</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">排名：</span>
          <span style="font-weight: 600; color: #F59E0B;">${formatRank(rank)}</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">开放率：</span>
          <span style="font-weight: 600; color: ${parseFloat(openRate) >= 50 ? '#10B981' : '#F59E0B'};">${openRate}%</span>
        </div>
      </div>
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #F3F4F6; font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `
}

// 区县开放情况分层tooltip
const districtOpenTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return ''

  const districtName = params[0].name
  let totalCount = 0
  let openCount = 0
  let details = ''

  // 汇总该区县的开放情况
  params.forEach((param: any) => {
    const statusName = param.seriesName
    const count = param.value
    totalCount += count

    if (statusName === '开放') {
      openCount = count
    }

    const color = getOpenStatusColor(statusName)
    details += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <span style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
          <span style="color: #6B7280;">${statusName}：</span>
        </span>
        <span style="font-weight: 600; color: #374151; margin-left: 8px;">${count} 座</span>
      </div>
    `
  })

  const openRate = totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(1) : '0'
  const filterHint = hasActiveFilters.value ? `（基于筛选的${data.value.length}座园林）` : `（基于全部${store.rawData.length}座园林）`

  return `
    <div style="padding: 8px; min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151; margin-bottom: 6px;">
        ${details}
      </div>
      <div style="padding: 6px 0; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #6B7280;">总计：</span>
          <span style="font-weight: 700; color: #111827;">${totalCount} 座</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 2px;">
          <span style="color: #6B7280;">开放率：</span>
          <span style="font-weight: 600; color: ${parseFloat(openRate) >= 50 ? '#10B981' : '#F59E0B'};">${openRate}%</span>
        </div>
      </div>
      <div style="font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `
}
</script>

<template>
  <div class="narrative-scene-3 p-6">
    <!-- 场景标题与说明 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        开放可达与权属/用途
      </h2>
      <p class="text-gray-600">
        解释开放性差异的结构性因素，识别权属与用途对可达性的影响
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
        title="开放园林"
        :value="metrics.openCount"
        unit="座"
      />
      <MetricCard
        title="开放率"
        :value="metrics.openRate"
      />
      <MetricCard
        title="未开放园林"
        :value="metrics.closedCount"
        unit="座"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 权属性质→开放情况桑基图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <SankeyChart
          title="权属性质→开放情况"
          :nodes="ownershipOpenSankeyData.nodes"
          :links="ownershipOpenSankeyData.links"
          height="450px"
        />
      </div>

      <!-- 当前用途×开放情况分层柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="当前用途×开放情况"
          :categories="useOpenData.categories"
          :series="useOpenData.series"
          x-axis-name="当前用途"
          y-axis-name="园林数量"
          height="450px"
        />
      </div>

      <!-- 区县×开放情况分层柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="区县×开放情况"
          :categories="districtOpenData.categories"
          :series="districtOpenData.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
          :tooltip-formatter="districtOpenTooltipFormatter"
        />
      </div>

      <!-- 区县人均开放资源 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="区县人均开放资源"
          :data="openGardenPerCapitaByDistrict.data"
          :colors="openGardenPerCapitaByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="人均开放园林 (个/万人)"
          height="400px"
          :tooltip-formatter="perCapitaTooltipFormatter"
        />
      </div>
    </div>

    <!-- 未开放园林清单表格 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        未开放园林清单
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
                权属性质
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                当前用途
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                文保级别
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                面积 (㎡)
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="garden in closedGardens"
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
                {{ garden.ownershipType }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.currentUse }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.heritageLevel }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.area.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="closedGardens.length === 0" class="text-center py-8 text-gray-500">
        暂无未开放园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
