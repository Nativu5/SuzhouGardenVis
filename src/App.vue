<script setup lang="ts">
import { onMounted } from 'vue'
import { useGardenStore } from './stores/gardenStore'

const gardenStore = useGardenStore()

onMounted(async () => {
  console.log('🚀 开始加载数据...')
  try {
    await gardenStore.loadData()
    console.log('✅ 数据加载完成!')
    console.log(`总记录数: ${gardenStore.rawData.length}`)
    console.log('前 3 条记录:', gardenStore.rawData.slice(0, 3))
    console.log('统计信息:', gardenStore.statistics)
  } catch (error) {
    console.error('❌ 数据加载失败:', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        苏州园林数据可视化 - 数据层测试
      </h1>

      <!-- 加载状态 -->
      <div v-if="gardenStore.isLoading" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p class="text-blue-700">正在加载数据...</p>
      </div>

      <!-- 错误状态 -->
      <div v-if="gardenStore.loadError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-700">加载失败: {{ gardenStore.loadError }}</p>
      </div>

      <!-- 数据统计 -->
      <div v-if="!gardenStore.isLoading && !gardenStore.loadError && gardenStore.rawData.length > 0"
           class="space-y-6">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-500 text-sm mb-1">园林总数</p>
            <p class="text-3xl font-bold text-gray-900">{{ gardenStore.statistics.totalCount }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-500 text-sm mb-1">开放园林</p>
            <p class="text-3xl font-bold text-green-600">{{ gardenStore.statistics.openCount }}</p>
            <p class="text-sm text-gray-500 mt-1">开放率: {{ gardenStore.statistics.openRate.toFixed(1) }}%</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <p class="text-gray-500 text-sm mb-1">世界遗产</p>
            <p class="text-3xl font-bold text-blue-600">{{ gardenStore.statistics.worldHeritageCount }}</p>
          </div>
        </div>

        <!-- 数据样本 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">数据样本（前 5 条）</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">区县</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">建造年代</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">面积(㎡)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文保级别</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">开放情况</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">世界遗产</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="garden in gardenStore.rawData.slice(0, 5)" :key="garden.name">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ garden.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ garden.district }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ garden.constructionPeriod }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ garden.area.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ garden.heritageLevel }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ garden.openStatus }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <span v-if="garden.isWorldHeritage" class="text-blue-600">✓</span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 派生字段测试 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">派生字段测试</h2>
          <div class="space-y-2">
            <p class="text-sm text-gray-600">
              <span class="font-medium">年代分类示例:</span>
              {{ gardenStore.rawData.slice(0, 3).map(g => `${g.name} (${g.constructionPeriod}) → ${g.eraCategory}`).join('; ') }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">面积区间示例:</span>
              {{ gardenStore.rawData.slice(0, 3).map(g => `${g.name} (${g.area}㎡) → ${g.areaRange}`).join('; ') }}
            </p>
          </div>
        </div>

        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-700 font-medium">✅ 里程碑 1 完成：数据层与类型系统已就绪</p>
          <p class="text-green-600 text-sm mt-1">数据加载、清洗、派生字段计算、状态管理均已正常工作</p>
        </div>
      </div>
    </div>
  </div>
</template>
