<!--
  中间主视图组件
  - 概览模式：图表网格容器
  - 探索模式：地图容器
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import { computed } from 'vue'
import NarrativeScene1 from '@/components/overview/NarrativeScene1.vue'
import NarrativeScene2 from '@/components/overview/NarrativeScene2.vue'
import NarrativeScene3 from '@/components/overview/NarrativeScene3.vue'
import NarrativeScene4 from '@/components/overview/NarrativeScene4.vue'

const gardenStore = useGardenStore()

// 判断是否为概览模式
const isOverviewMode = computed(() => gardenStore.viewMode === 'overview')

// 当前叙事场景
const currentNarrative = computed(() => gardenStore.overviewNarrative)
</script>

<template>
  <main class="flex-1 bg-gray-50 overflow-auto">
    <!-- 概览模式：叙事场景 -->
    <div v-if="isOverviewMode" class="h-full">
      <!-- 根据当前叙事场景显示对应组件 -->
      <NarrativeScene1 v-if="currentNarrative === 'spatial_heritage'" />
      <NarrativeScene2 v-else-if="currentNarrative === 'historical_rhythm'" />
      <NarrativeScene3 v-else-if="currentNarrative === 'accessibility_ownership'" />
      <NarrativeScene4 v-else-if="currentNarrative === 'scale_resources'" />
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
