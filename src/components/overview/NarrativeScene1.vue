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
  groupByDistrictAndHeritageLevel
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

// 世界遗产在各区县的分布
const worldHeritageByDistrict = computed(() => {
  const heritageData = data.value.filter(item => item.isWorldHeritage)
  const result = groupByDistrict(heritageData)
  return {
    data: result,
    colors: result.map(item => getDistrictColor(item.name))
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

      <!-- 区县园林数量柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="各区县园林数量"
          :data="gardenCountByDistrict.data"
          :colors="gardenCountByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
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
        />
      </div>

      <!-- 世界遗产在区县分布 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="世界遗产在区县分布"
          :data="worldHeritageByDistrict.data"
          :colors="worldHeritageByDistrict.colors"
          x-axis-name="区县"
          y-axis-name="世界遗产数量"
          height="400px"
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
