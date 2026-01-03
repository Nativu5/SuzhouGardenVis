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
import MapView from '@/components/map/MapView.vue'

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
    <div v-else class="h-full">
      <MapView />
    </div>
  </main>
</template>
