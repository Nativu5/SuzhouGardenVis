<!--
  顶部导航栏组件
  - 项目标题
  - 模式切换按钮（概览/探索）
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore';
import type { ViewMode } from '@/types';

const gardenStore = useGardenStore();

const toggleViewMode = () => {
  const newMode: ViewMode = gardenStore.viewMode === 'overview' ? 'explore' : 'overview';
  gardenStore.setViewMode(newMode);
};

const openGitHub = () => {
  window.open('https://github.com/Nativu5/SuzhouGardenVis', '_blank', 'noopener,noreferrer');
};
</script>

<template>
  <header class="border-b border-gray-200 bg-white shadow-sm">
    <div class="flex h-16 items-center justify-between px-6">
      <!-- 左侧：项目标题 -->
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold text-gray-900">苏州园林数据可视化</h1>
        <!-- GitHub 按钮 -->
        <button
          class="flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100"
          title="在 GitHub 上查看源代码"
          aria-label="GitHub 仓库"
          @click="openGitHub"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
        </button>
      </div>

      <!-- 右侧：模式切换 -->
      <div class="flex items-center space-x-4">
        <!-- 当前模式指示 -->
        <div class="text-sm text-gray-600">
          <span class="font-medium">
            {{ gardenStore.viewMode === 'overview' ? '概览模式' : '探索模式' }}
          </span>
        </div>

        <!-- 切换按钮 -->
        <button
          class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
          @click="toggleViewMode"
        >
          <svg
            v-if="gardenStore.viewMode === 'overview'"
            class="h-4 w-4"
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
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
