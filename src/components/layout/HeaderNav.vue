<!--
  顶部导航栏组件
  - 项目标题
  - 模式切换按钮（概览/探索）
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import type { ViewMode } from '@/types'

const gardenStore = useGardenStore()

const toggleViewMode = () => {
  const newMode: ViewMode = gardenStore.viewMode === 'overview' ? 'explore' : 'overview'
  gardenStore.setViewMode(newMode)
}
</script>

<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="h-16 px-6 flex items-center justify-between">
      <!-- 左侧：项目标题 -->
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold text-gray-900">
          苏州园林数据可视化
        </h1>
        <div class="text-sm text-gray-500">
          Suzhou Gardens Visualization
        </div>
      </div>

      <!-- 右侧：模式切换按钮 -->
      <div class="flex items-center space-x-4">
        <!-- 当前模式指示 -->
        <div class="text-sm text-gray-600">
          <span class="font-medium">
            {{ gardenStore.viewMode === 'overview' ? '概览模式' : '探索模式' }}
          </span>
        </div>

        <!-- 切换按钮 -->
        <button
          @click="toggleViewMode"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <svg
            v-if="gardenStore.viewMode === 'overview'"
            class="w-4 h-4"
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
          <svg
            v-else
            class="w-4 h-4"
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
          <span>
            {{ gardenStore.viewMode === 'overview' ? '切换到探索模式' : '切换到概览模式' }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>
