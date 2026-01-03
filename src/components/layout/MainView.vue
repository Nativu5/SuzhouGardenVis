<!--
  中间主视图组件
  - 概览模式：图表网格容器
  - 探索模式：地图容器
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import { computed } from 'vue'

const gardenStore = useGardenStore()

// 判断是否为概览模式
const isOverviewMode = computed(() => gardenStore.viewMode === 'overview')

// 当前叙事场景
const currentNarrative = computed(() => gardenStore.overviewNarrative)

// 叙事场景标题
const narrativeTitles: Record<string, string> = {
  spatial_heritage: '空间集中与遗产核心',
  historical_rhythm: '历史谱系与认定节奏',
  accessibility_ownership: '开放可达与权属/用途',
  scale_resources: '规模结构与资源配置'
}

// 叙事场景说明
const narrativeDescriptions: Record<string, string> = {
  spatial_heritage: '呈现园林在苏州各区县的集中程度与高等级保护的空间分布',
  historical_rhythm: '展示建设时期结构与认定批次的关系，观察不同年代的保护级别分布',
  accessibility_ownership: '解释开放性差异的结构性因素，识别权属与用途对可达性的影响',
  scale_resources: '展示园林规模分布与开放性的关联，识别大型园林所在区域与时代'
}
</script>

<template>
  <main class="flex-1 bg-gray-50 overflow-auto">
    <!-- 概览模式：图表网格 -->
    <div v-if="isOverviewMode" class="h-full p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- 叙事场景标题与说明 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            {{ narrativeTitles[currentNarrative] }}
          </h2>
          <p class="text-gray-600 text-sm leading-relaxed">
            {{ narrativeDescriptions[currentNarrative] }}
          </p>
        </div>

        <!-- 图表网格容器（占位） -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="text-center text-gray-500 py-20">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p class="text-lg font-medium mb-1">叙事场景图表</p>
            <p class="text-sm">（里程碑 3 实现）</p>
            <p class="text-xs mt-2 text-gray-400">
              将展示 {{ narrativeTitles[currentNarrative] }} 相关的统计图表与表格
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 探索模式：地图视图 -->
    <div v-else class="h-full relative">
      <!-- 地图容器（占位） -->
      <div class="w-full h-full bg-gray-100 flex items-center justify-center">
        <div class="text-center text-gray-500">
          <svg
            class="w-20 h-20 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p class="text-lg font-medium mb-1">地图视图</p>
          <p class="text-sm">（里程碑 4 实现）</p>
          <p class="text-xs mt-2 text-gray-400">
            将集成高德地图，展示苏州市行政区边界与园林点位
          </p>
        </div>
      </div>

      <!-- 地图控件（占位） -->
      <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <button
          class="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
          disabled
        >
          聚合/散点切换
        </button>
      </div>
    </div>
  </main>
</template>
