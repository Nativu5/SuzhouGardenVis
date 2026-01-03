<script setup lang="ts">
/**
 * 叙事场景4：规模结构与资源配置
 * 展示园林规模分布与开放性的关联，识别大型园林所在区域与时代
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import HistogramChart from '@/components/charts/HistogramChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByAreaRangeAndOpenStatus,
  groupAverageAreaByDistrict,
  groupAreaByDistrict,
  groupAverageAreaByEraCategory
} from '@/utils/chartDataProcessor'
import {
  getOpenStatusColor,
  getDistrictColor,
  getEraCategoryColor
} from '@/config/theme'

const store = useGardenStore()

// 使用过滤后的数据
const data = computed(() => store.filteredData)

// 面积 Top10 园林
const top10Gardens = computed(() => {
  return [...data.value]
    .sort((a, b) => b.area - a.area)
    .slice(0, 10)
})

// 面积区间×开放情况分层统计
const areaOpenData = computed(() => {
  const result = groupByAreaRangeAndOpenStatus(data.value)
  return {
    intervals: result.intervals,
    series: result.series.map(s => ({
      ...s,
      color: getOpenStatusColor(s.name)
    }))
  }
})

// 按区县统计平均面积
const avgAreaByDistrict = computed(() => {
  const result = groupAverageAreaByDistrict(data.value)
  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 按区县统计总面积
const totalAreaByDistrict = computed(() => {
  const result = groupAreaByDistrict(data.value)
  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
  }
})

// 按建造年代统计平均面积
const avgAreaByEra = computed(() => {
  const result = groupAverageAreaByEraCategory(data.value)
  return {
    data: result,
    colors: result.map(item => getEraCategoryColor(item.name))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const totalArea = data.value.reduce((sum, item) => sum + item.area, 0)
  const avgArea = totalCount > 0 ? Math.round(totalArea / totalCount) : 0
  const maxArea = top10Gardens.value[0]?.area || 0

  return {
    totalCount,
    totalArea: Math.round(totalArea),
    avgArea,
    maxArea: Math.round(maxArea)
  }
})
</script>

<template>
  <div class="narrative-scene-4 p-6">
    <!-- 场景标题与说明 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        规模结构与资源配置
      </h2>
      <p class="text-gray-600">
        展示园林规模分布与开放性的关联，识别大型园林所在区域与时代
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
        title="总面积"
        :value="metrics.totalArea"
        unit="㎡"
      />
      <MetricCard
        title="平均面积"
        :value="metrics.avgArea"
        unit="㎡"
      />
      <MetricCard
        title="最大面积"
        :value="metrics.maxArea"
        unit="㎡"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 面积区间直方图（按开放情况分层） -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
        <HistogramChart
          title="面积区间分布（按开放情况分层）"
          :intervals="areaOpenData.intervals"
          :series="areaOpenData.series"
          x-axis-name="面积区间 (㎡)"
          y-axis-name="园林数量"
          height="400px"
        />
      </div>

      <!-- 区县平均面积柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县平均面积"
          :data="avgAreaByDistrict.data"
          :colors="avgAreaByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="平均面积 (㎡)"
          height="400px"
        />
      </div>

      <!-- 区县总面积柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县总面积"
          :data="totalAreaByDistrict.data"
          :colors="totalAreaByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="总面积 (㎡)"
          height="400px"
        />
      </div>

      <!-- 建造年代平均面积柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="建造年代平均面积"
          :data="avgAreaByEra.data"
          :colors="avgAreaByEra.colors"
          x-axis-name="建造年代"
          y-axis-name="平均面积 (㎡)"
          height="400px"
        />
      </div>
    </div>

    <!-- 面积 Top10 园林表格 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        面积 Top10 园林
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                排名
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                面积 (㎡)
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                区县
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建造年代
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                开放情况
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="(garden, index) in top10Gardens"
              :key="garden.name"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ index + 1 }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ garden.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 font-semibold">
                {{ garden.area.toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.district }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.constructionPeriod }}
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
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="top10Gardens.length === 0" class="text-center py-8 text-gray-500">
        暂无园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
