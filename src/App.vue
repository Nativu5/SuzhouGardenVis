<script setup lang="ts">
import { onMounted } from 'vue'
import { useGardenStore } from './stores/gardenStore'
import MainLayout from './components/layout/MainLayout.vue'

const gardenStore = useGardenStore()

onMounted(async () => {
  console.log('🚀 加载数据...')
  try {
    await gardenStore.loadData()
    console.log(`✅ 数据加载完成: ${gardenStore.rawData.length} 条记录`)
  } catch (error) {
    console.error('❌ 数据加载失败:', error)
  }
})
</script>

<template>
  <div id="app">
    <!-- 加载状态遮罩 -->
    <div
      v-if="gardenStore.isLoading"
      class="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 font-medium">正在加载数据...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="gardenStore.loadError"
      class="fixed inset-0 bg-red-50 flex items-center justify-center z-50"
    >
      <div class="text-center max-w-md p-8">
        <svg
          class="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 class="text-xl font-bold text-red-900 mb-2">数据加载失败</h2>
        <p class="text-red-700 mb-4">{{ gardenStore.loadError }}</p>
        <button
          @click="gardenStore.loadData()"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          重试
        </button>
      </div>
    </div>

    <!-- 主布局 -->
    <MainLayout v-else />
  </div>
</template>
