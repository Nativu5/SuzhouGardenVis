<script setup lang="ts">
/**
 * 叙事场景选择器组件
 * 用于切换概览模式的四个叙事场景
 */

import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'
import type { NarrativeScene } from '@/types'

// 叙事场景配置
const narrativeOptions = [
  {
    value: 'spatial_heritage' as NarrativeScene,
    label: '空间集中与遗产核心',
    description: '呈现园林在苏州各区县的集中程度与高等级保护的空间分布'
  },
  {
    value: 'historical_rhythm' as NarrativeScene,
    label: '历史谱系与认定节奏',
    description: '展示建设时期结构与认定批次的关系，观察不同年代的保护级别分布'
  },
  {
    value: 'accessibility_ownership' as NarrativeScene,
    label: '开放可达与权属/用途',
    description: '解释开放性差异的结构性因素，识别权属与用途对可达性的影响'
  },
  {
    value: 'scale_resources' as NarrativeScene,
    label: '规模结构与资源配置',
    description: '展示园林规模分布与开放性的关联，识别大型园林所在区域与时代'
  }
]

const store = useGardenStore()

const selectedNarrative = computed({
  get: () => store.overviewNarrative,
  set: (value: NarrativeScene) => {
    store.setOverviewNarrative(value)
  }
})

const currentNarrativeInfo = computed(() => {
  return narrativeOptions.find(opt => opt.value === selectedNarrative.value)
})
</script>

<template>
  <div class="narrative-selector">
    <div class="mb-2">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        叙事场景
      </label>
      <select
        v-model="selectedNarrative"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
      >
        <option
          v-for="option in narrativeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>

    <div
      v-if="currentNarrativeInfo"
      class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200"
    >
      <div class="font-medium mb-1">场景说明：</div>
      <div>{{ currentNarrativeInfo.description }}</div>
    </div>
  </div>
</template>

<style scoped>
select {
  cursor: pointer;
}

select:hover {
  border-color: #9CA3AF;
}
</style>
