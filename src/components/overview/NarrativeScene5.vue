<script setup lang="ts">
/**
 * 叙事场景5：保护状况与风险提示（新增）
 * 识别保护风险与治理薄弱点，形成"保护-开放"的治理线索
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import HeatmapMatrixChart from '@/components/charts/HeatmapMatrixChart.vue'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  generateProtectionOpenStatusMatrix,
  groupByDistrictAndProtectionStatus
} from '@/utils/chartDataProcessor'
import {
  getProtectionStatusColor
} from '@/config/theme'

const store = useGardenStore()

// 使用过滤后的数据
const data = computed(() => store.filteredData)

// 风险园林列表（保护状况为"中"或"差"）
const riskGardens = computed(() => {
  return data.value
    .filter(item => item.protectionStatus === '中' || item.protectionStatus === '差')
    .sort((a, b) => {
      // 先按保护状况排序（差 > 中），再按区县排序
      if (a.protectionStatus !== b.protectionStatus) {
        return a.protectionStatus === '差' ? -1 : 1
      }
      return a.district.localeCompare(b.district)
    })
})

// 保护状况×开放情况矩阵数据
const protectionOpenMatrix = computed(() => {
  return generateProtectionOpenStatusMatrix(data.value)
})

// 区县×保护状况分层统计
const districtProtectionData = computed(() => {
  const result = groupByDistrictAndProtectionStatus(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getProtectionStatusColor(s.name)
    }))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const goodCount = data.value.filter(item => item.protectionStatus === '好').length
  const mediumCount = data.value.filter(item => item.protectionStatus === '中').length
  const poorCount = data.value.filter(item => item.protectionStatus === '差').length
  const riskCount = riskGardens.value.length
  const riskRate = totalCount > 0 ? ((riskCount / totalCount) * 100).toFixed(1) : '0'

  return {
    totalCount,
    goodCount,
    mediumCount,
    poorCount,
    riskCount,
    riskRate: `${riskRate}%`
  }
})

// 关键结论数据
const keyInsights = computed(() => {
  // 计算中/差园林中不开放的比例
  const riskGardensData = data.value.filter(item =>
    item.protectionStatus === '中' || item.protectionStatus === '差'
  )
  const riskClosedCount = riskGardensData.filter(item => item.openStatus === '不开放').length
  const riskClosedRate = riskGardensData.length > 0
    ? ((riskClosedCount / riskGardensData.length) * 100).toFixed(1)
    : '0'

  // 统计风险园林在各区县的分布
  const districtRiskMap = new Map<string, number>()
  riskGardensData.forEach(item => {
    districtRiskMap.set(item.district, (districtRiskMap.get(item.district) || 0) + 1)
  })

  // 找出风险园林数量最多的区县
  const topRiskDistricts = Array.from(districtRiskMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([district]) => district)
    .join('、')

  return {
    riskClosedRate,
    topRiskDistricts: topRiskDistricts || '无'
  }
})
</script>

<template>
  <div class="narrative-scene-5 p-6">
    <!-- 场景标题与核心观点 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        保护状况与风险提示
      </h2>
      <div class="text-sm text-gray-600 mb-4">
        <strong>核心观点：</strong>保护状况为"中/差"的园林多数不开放，风险主要集中在少数区县与特定权属结构。
      </div>

      <!-- 阅读路径提示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>阅读路径：</strong>
        先看"保护×开放矩阵"理解状况与开放关联，再看"区县分布"识别风险集中区，最后浏览"风险园林清单"
      </div>
    </div>

    <!-- 关键结论条 -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <div class="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
        <div class="text-xs text-red-600 font-medium mb-1">保护与开放关联</div>
        <div class="text-lg font-bold text-red-800">
          保护状况为"中/差"的园林中，不开放比例达 {{ keyInsights.riskClosedRate }}%
        </div>
        <div class="text-xs text-red-600 mt-1">保护状况与开放性存在明显关联</div>
      </div>
      <div class="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
        <div class="text-xs text-amber-600 font-medium mb-1">风险空间集中</div>
        <div class="text-lg font-bold text-amber-800">
          风险园林集中在 {{ keyInsights.topRiskDistricts }}
        </div>
        <div class="text-xs text-amber-600 mt-1">可作为治理重点提示</div>
      </div>
    </div>

    <!-- KPI 指标卡 -->
    <div class="grid grid-cols-5 gap-4 mb-6">
      <MetricCard
        title="园林总数"
        :value="metrics.totalCount"
        unit="座"
      />
      <MetricCard
        title="状况良好"
        :value="metrics.goodCount"
        unit="座"
      />
      <MetricCard
        title="状况中等"
        :value="metrics.mediumCount"
        unit="座"
      />
      <MetricCard
        title="状况较差"
        :value="metrics.poorCount"
        unit="座"
      />
      <MetricCard
        title="风险比例"
        :value="metrics.riskRate"
        description="中+差"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 保护状况×开放情况矩阵热力图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <HeatmapMatrixChart
          title="保护状况×开放情况矩阵"
          :data="protectionOpenMatrix.matrixData"
          :x-categories="protectionOpenMatrix.xCategories"
          :y-categories="protectionOpenMatrix.yCategories"
          x-axis-name="保护状况"
          y-axis-name="开放情况"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：色深表示数量，鼠标悬停显示保护状况内开放率
        </div>
      </div>

      <!-- 区县×保护状况堆叠条形图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="区县×保护状况分布"
          :categories="districtProtectionData.categories"
          :series="districtProtectionData.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：展示各区县保护状况构成，颜色=保护状况
        </div>
      </div>
    </div>

    <!-- 风险园林清单表格 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        风险园林清单（保护状况为"中"或"差"）
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                保护状况
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
                权属性质
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="garden in riskGardens"
              :key="garden.name"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ garden.name }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="{
                    'text-yellow-600': garden.protectionStatus === '中',
                    'text-red-600': garden.protectionStatus === '差'
                  }"
                  class="font-semibold"
                >
                  {{ garden.protectionStatus }}
                </span>
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
                    'text-yellow-600': garden.openStatus === '预约开放',
                    'text-red-600': garden.openStatus === '不开放'
                  }"
                >
                  {{ garden.openStatus }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.ownershipType }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="riskGardens.length === 0" class="text-center py-8 text-gray-500">
        暂无风险园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
