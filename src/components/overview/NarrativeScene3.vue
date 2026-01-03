<script setup lang="ts">
/**
 * 叙事场景3：开放可达与权属/用途
 * 解释开放性差异的结构性因素，识别权属与用途对可达性的影响
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import SankeyChart from '@/components/charts/SankeyChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByOwnershipAndOpenStatus,
  groupByCurrentUseAndOpenStatus,
  groupByDistrictAndOpenStatus
} from '@/utils/chartDataProcessor'
import {
  getOpenStatusColor
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
      <div class="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
        <StackedBarChart
          title="区县×开放情况"
          :categories="districtOpenData.categories"
          :series="districtOpenData.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
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
