<script setup lang="ts">
import { onMounted } from 'vue';
import { useGardenStore } from './stores/gardenStore';
import MainLayout from './components/layout/MainLayout.vue';

const gardenStore = useGardenStore();

onMounted(async () => {
  console.log('🚀 加载数据...');
  try {
    await gardenStore.loadData();
    console.log(`✅ 数据加载完成: ${gardenStore.rawData.length} 条记录`);
  } catch (error) {
    console.error('❌ 数据加载失败:', error);
  }
});
</script>

<template>
  <div id="app">
    <!-- 加载状态遮罩 -->
    <div
      v-if="gardenStore.isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
        ></div>
        <p class="font-medium text-gray-600">正在加载数据...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div
      v-else-if="gardenStore.loadError"
      class="fixed inset-0 z-50 flex items-center justify-center bg-red-50"
    >
      <div class="max-w-md p-8 text-center">
        <svg
          class="mx-auto mb-4 h-16 w-16 text-red-500"
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
        <h2 class="mb-2 text-xl font-bold text-red-900">数据加载失败</h2>
        <p class="mb-4 text-red-700">{{ gardenStore.loadError }}</p>
        <button
          class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          @click="gardenStore.loadData()"
        >
          重试
        </button>
      </div>
    </div>

    <!-- 主布局 -->
    <MainLayout v-else />
  </div>
</template>
