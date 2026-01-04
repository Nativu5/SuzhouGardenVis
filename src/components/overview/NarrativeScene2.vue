<script setup lang="ts">
/**
 * 叙事场景2：历史谱系与认定节奏
 * 展示建设时期结构与认定批次的关系，观察不同年代的保护级别分布
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import MetricCard from './MetricCard.vue'
import {
  groupByEraCategory,
  groupByEraCategoryAndHeritageLevel,
  groupByBatchAndEraCategory
} from '@/utils/chartDataProcessor'
import {
  getEraCategoryColor,
  getHeritageLevelColor
} from '@/config/theme'

const store = useGardenStore()

// 使用过滤后的数据
const data = computed(() => store.filteredData)

// 早期年代园林（宋代及以前）
const earlyGardens = computed(() => {
  return data.value
    .filter(item => item.eraCategory === '宋代及以前')
    .sort((a, b) => {
      // 同为宋代及以前，尝试根据具体朝代排序
      const subOrder: Record<string, number> = { '春秋': 1, '汉': 2, '南朝': 3, '南北朝': 3, '宋': 4 }
      const getSubRank = (period: string) => {
        for (const [key, rank] of Object.entries(subOrder)) {
          if (period.includes(key)) return rank
        }
        return 99 // 未知
      }
      return getSubRank(a.constructionPeriod) - getSubRank(b.constructionPeriod)
    })
})

// 年代排序辅助函数
const getEraRank = (era: string): number => {
  const order = ['宋代及以前', '元代', '明代', '清代', '民国', '现代']
  const index = order.indexOf(era)
  return index === -1 ? 999 : index
}

// 按建造年代统计
const gardenByEra = computed(() => {
  const result = groupByEraCategory(data.value)
  return {
    data: result,
    colors: result.map(item => getEraCategoryColor(item.name))
  }
})

// 按建造年代×文保级别分层统计
const eraHeritageData = computed(() => {
  const result = groupByEraCategoryAndHeritageLevel(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getHeritageLevelColor(s.name)
    }))
  }
})

// 按公布批次×建造年代分层统计
const batchEraData = computed(() => {
  const result = groupByBatchAndEraCategory(data.value)
  return {
    categories: result.categories,
    series: result.series.map(s => ({
      ...s,
      color: getEraCategoryColor(s.name)
    }))
  }
})

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length
  const earlyCount = earlyGardens.value.length
  
  // 寻找最早的园林
  const sortedByEra = [...data.value].sort((a, b) => {
    const rankA = getEraRank(a.eraCategory)
    const rankB = getEraRank(b.eraCategory)
    if (rankA !== rankB) return rankA - rankB
    
    // 同年代分类，尝试更细粒度排序（针对宋代及以前）
    if (a.eraCategory === '宋代及以前') {
      const subOrder: Record<string, number> = { '春秋': 1, '汉': 2, '南朝': 3, '南北朝': 3, '宋': 4 }
      const getSubRank = (period: string) => {
        for (const [key, rank] of Object.entries(subOrder)) {
          if (period.includes(key)) return rank
        }
        return 99
      }
      return getSubRank(a.constructionPeriod) - getSubRank(b.constructionPeriod)
    }
    
    return 0
  })
  
  const oldestGarden = sortedByEra[0]

  const batchCount = new Set(data.value.map(item => item.publicationBatch)).size

  return {
    totalCount,
    earlyCount,
    oldestGarden: oldestGarden ? `${oldestGarden.name} (${oldestGarden.constructionPeriod})` : '-',
    batchCount
  }
})
</script>

<template>
  <div class="narrative-scene-2 p-6">
    <!-- 场景标题与核心观点 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        历史谱系与认定节奏
      </h2>
      <div class="text-sm text-gray-600 mb-4">
        <strong>核心观点：</strong>认定节奏存在明显阶段性，现代园林集中在后期批次，早期园林分布更分散，体现价值认定的时序差异。
      </div>

      <!-- 阅读路径提示 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>阅读路径：</strong>
        先看"公布批次×建造年代"识别批次节奏，再看"建造年代×文保级别"理解等级分布，最后浏览"早期园林清单"
      </div>
    </div>

    <!-- 关键结论条 -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <div class="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
        <div class="text-xs text-purple-600 font-medium mb-1">认定节奏</div>
        <div class="text-lg font-bold text-purple-800">
          现代园林集中在后期批次（3/4）
        </div>
        <div class="text-xs text-purple-600 mt-1">早期园林分布更分散，体现价值认定的时序差异</div>
      </div>
      <div class="bg-linear-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
        <div class="text-xs text-amber-600 font-medium mb-1">历史规模</div>
        <div class="text-lg font-bold text-amber-800">
          明代与宋代及以前园林面积整体更大
        </div>
        <div class="text-xs text-amber-600 mt-1">体现历史园林的规模优势</div>
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
        title="早期园林"
        :value="metrics.earlyCount"
        unit="座"
        description="宋代及以前"
      />
      <MetricCard
        title="最早园林"
        :value="metrics.oldestGarden"
      />
      <MetricCard
        title="公布批次数"
        :value="metrics.batchCount"
        unit="批"
      />
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- 建设时期数量柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <BarChart
          title="建设时期数量分布"
          :data="gardenByEra.data"
          :colors="gardenByEra.colors"
          x-axis-name="建造年代"
          y-axis-name="园林数量"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：清代园林占主导，现代园林占比较高
        </div>
      </div>

      <!-- 建造年代×文保单位级别分层柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <StackedBarChart
          title="建造年代×文保单位级别"
          :categories="eraHeritageData.categories"
          :series="eraHeritageData.series"
          x-axis-name="建造年代"
          y-axis-name="园林数量"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：展示不同年代园林的文保级别分布，颜色=文保级别
        </div>
      </div>

      <!-- 公布批次×建造年代分层柱状图 -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
        <StackedBarChart
          title="公布批次×建造年代"
          :categories="batchEraData.categories"
          :series="batchEraData.series"
          x-axis-name="公布批次"
          y-axis-name="园林数量"
          height="400px"
        />
        <div class="text-xs text-gray-500 mt-2">
          注：现代园林集中在批次3/4，早期园林分布更分散；颜色=建造年代
        </div>
      </div>
    </div>

    <!-- 早期年代园林清单表格 -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        早期园林清单（宋代及以前）
      </h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名称
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                建造年代
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                年代分类
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                文保级别
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                公布批次
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                区县
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="garden in earlyGardens"
              :key="garden.name"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ garden.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.constructionPeriod }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.eraCategory }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.heritageLevel }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.publicationBatch }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.district }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="earlyGardens.length === 0" class="text-center py-8 text-gray-500">
        暂无早期年代园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
