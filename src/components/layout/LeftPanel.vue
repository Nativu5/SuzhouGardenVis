<!--
  左侧操作区组件
  - 概览模式：叙事场景选择器 + 场景筛选器容器
  - 探索模式：搜索框 + 多维筛选器容器
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import { computed } from 'vue'
import type { NarrativeScene } from '@/types'

const gardenStore = useGardenStore()

// 判断是否为概览模式
const isOverviewMode = computed(() => gardenStore.viewMode === 'overview')

// 叙事场景选项
const narrativeOptions: Array<{ value: NarrativeScene; label: string }> = [
  { value: 'spatial_heritage', label: '空间集中与遗产核心' },
  { value: 'historical_rhythm', label: '历史谱系与认定节奏' },
  { value: 'accessibility_ownership', label: '开放可达与权属/用途' },
  { value: 'scale_resources', label: '规模结构与资源配置' }
]

// 当前叙事场景的标签
const currentNarrativeLabel = computed(() => {
  const option = narrativeOptions.find(opt => opt.value === gardenStore.overviewNarrative)
  return option?.label || ''
})

// 处理叙事场景切换
const handleNarrativeChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as NarrativeScene
  gardenStore.setOverviewNarrative(value)
}
</script>

<template>
  <aside class="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
    <!-- 概览模式 -->
    <div v-if="isOverviewMode" class="flex-1 flex flex-col p-6 space-y-6">
      <!-- 叙事场景选择器 -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          叙事场景
        </label>
        <select
          :value="gardenStore.overviewNarrative"
          @change="handleNarrativeChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

      <!-- 场景说明 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800 leading-relaxed">
          <span class="font-semibold">{{ currentNarrativeLabel }}</span>
        </p>
        <p class="text-xs text-blue-600 mt-2">
          使用下方的筛选器可以进一步细化当前场景的数据展示
        </p>
      </div>

      <!-- 场景筛选器容器（占位） -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">
          <div class="text-sm text-gray-500 text-center py-8">
            场景专用筛选器
            <br />
            （后续里程碑实现）
          </div>
        </div>
      </div>
    </div>

    <!-- 探索模式 -->
    <div v-else class="flex-1 flex flex-col p-6 space-y-6">
      <!-- 搜索框 -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          搜索园林
        </label>
        <div class="relative">
          <input
            type="text"
            :value="gardenStore.filters.searchKeyword || ''"
            @input="gardenStore.updateFilters({ searchKeyword: ($event.target as HTMLInputElement).value })"
            placeholder="输入园林名称..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <!-- 筛选结果统计 -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">筛选结果</span>
          <span class="text-lg font-bold text-gray-900">
            {{ gardenStore.filteredData.length }}
          </span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          共 {{ gardenStore.rawData.length }} 条数据
        </div>
      </div>

      <!-- 多维筛选器容器（占位） -->
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">
          <div class="text-sm text-gray-500 text-center py-8">
            多维筛选器
            <br />
            （后续里程碑实现）
          </div>

          <!-- 清空筛选按钮 -->
          <button
            v-if="Object.keys(gardenStore.filters).length > 0"
            @click="gardenStore.clearFilters()"
            class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
          >
            清空筛选
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
