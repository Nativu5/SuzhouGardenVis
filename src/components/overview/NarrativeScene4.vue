<script setup lang="ts">
/**
 * 叙事场景4：规模结构与资源配置
 * 展示园林规模分布与开放性的关联，识别大型园林所在区域与时代
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import HistogramChart from '@/components/charts/HistogramChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import BarLineChart from '@/components/charts/BarLineChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByAreaRangeAndOpenStatus,
  groupAverageAreaByDistrict,
  groupAreaByDistrict,
  groupAverageAreaByEraCategory
} from '@/utils/chartDataProcessor'
import {
  getOpenStatusColor,
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
  return groupAverageAreaByDistrict(data.value)
})

// 按区县统计总面积
const totalAreaByDistrict = computed(() => {
  return groupAreaByDistrict(data.value)
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

// 关键结论数据
const keyInsights = computed(() => {
  const totalArea = data.value.reduce((sum, item) => sum + item.area, 0)
  const top10Area = top10Gardens.value.reduce((sum, item) => sum + item.area, 0)
  const top10Percentage = totalArea > 0 ? ((top10Area / totalArea) * 100).toFixed(1) : '0'

  const openGardens = data.value.filter(item => item.openStatus === '开放')
  const closedGardens = data.value.filter(item => item.openStatus === '不开放')

  const openAvgArea = openGardens.length > 0
    ? Math.round(openGardens.reduce((sum, item) => sum + item.area, 0) / openGardens.length)
    : 0
  const closedAvgArea = closedGardens.length > 0
    ? Math.round(closedGardens.reduce((sum, item) => sum + item.area, 0) / closedGardens.length)
    : 0

  return {
    top10Percentage,
    openAvgArea,
    closedAvgArea
  }
})
</script>

<template>
  <div class="narrative-scene-4 p-6">
    <!-- 场景标题与核心观点 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        规模结构与资源配置
      </h2>
      <div class="text-sm text-gray-600 mb-4">
        <strong>核心观点：</strong>园林规模呈强烈长尾分布，少数大园林占据近半面积，开放园林在规模上明显占优。
      </div>

      <!-- 阅读路径提示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>阅读路径：</strong>
        先看"面积区间分布"理解长尾结构，再看"Top10清单"识别大园林，最后查"区县/年代平均面积"理解地域/时代差异
      </div>
    </div>

    <!-- 关键结论条 -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <div class="bg-linear-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
        <div class="text-xs text-orange-600 font-medium mb-1">资源集中度</div>
        <div class="text-lg font-bold text-orange-800">
          Top10 园林占总面积约 {{ keyInsights.top10Percentage }}%，呈显著集中
        </div>
        <div class="text-xs text-orange-600 mt-1">少数大园林占据近半面积</div>
      </div>
      <div class="bg-linear-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-4">
        <div class="text-xs text-teal-600 font-medium mb-1">规模与开放性</div>
        <div class="text-lg font-bold text-teal-800">
          开放园林平均面积 {{ keyInsights.openAvgArea.toLocaleString() }} ㎡ > 不开放 {{ keyInsights.closedAvgArea.toLocaleString() }} ㎡
        </div>
        <div class="text-xs text-teal-600 mt-1">规模与开放正相关</div>
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
        <div class="text-xs text-gray-500 mt-2">
          注：呈显著长尾分布，小面积园林数量多，大面积园林稀少；开放园林在各区间均有分布
        </div>
      </div>

      <!-- 区县总面积与平均面积组合图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarLineChart
          title="各区县总面积与平均面积"
          :bar-data="totalAreaByDistrict"
          :line-data="avgAreaByDistrict"
          bar-name="总面积"
          line-name="平均面积"
          bar-color="#5470C6"
          line-color="#EE6666"
          x-axis-name="区县"
          y-axis-left-name="总面积 (㎡)"
          y-axis-right-name="平均面积 (㎡)"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：姑苏区总面积与平均面积均占主导地位，兼具数量与规模优势；柱状图表示总面积（左轴），折线表示平均面积（右轴）
        </div>
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
        <div class="text-xs text-gray-500 mt-2">
          注：明代与宋代及以前园林平均面积更大，体现历史园林的规模优势
        </div>
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
