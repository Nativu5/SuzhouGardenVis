<!--
  左侧操作区组件
  - 概览模式：叙事场景选择器 + 场景筛选器容器
  - 探索模式：搜索框 + 多维筛选器容器
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore'
import { computed } from 'vue'
import NarrativeSelector from '@/components/overview/NarrativeSelector.vue'
import MetricCard from '@/components/overview/MetricCard.vue'
import ExploreFilters from '@/components/filters/ExploreFilters.vue'
import FilterTags from '@/components/filters/FilterTags.vue'

const gardenStore = useGardenStore()

// 判断是否为概览模式
const isOverviewMode = computed(() => gardenStore.viewMode === 'overview')

// 统计指标
const stats = computed(() => gardenStore.statistics)
</script>

<template>
  <aside class="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
    <!-- 概览模式 -->
    <div v-if="isOverviewMode" class="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      <!-- 叙事场景选择器 -->
      <NarrativeSelector />

      <!-- 整体统计指标 -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-700">整体概况</h3>
        <div class="grid grid-cols-2 gap-3">
          <MetricCard
            title="园林总数"
            :value="stats.totalCount"
            unit="座"
          />
          <MetricCard
            title="开放园林"
            :value="stats.openCount"
            unit="座"
          />
          <MetricCard
            title="开放率"
            :value="stats.openRate.toFixed(1)"
            unit="%"
          />
          <MetricCard
            title="世界遗产"
            :value="stats.worldHeritageCount"
            unit="座"
          />
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-xs text-blue-700 leading-relaxed">
          在概览模式下，您可以通过叙事场景切换来查看不同维度的数据洞察。
        </p>
      </div>
    </div>

    <!-- 探索模式 -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="p-6 space-y-4">
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

        <!-- 筛选标签 -->
        <FilterTags />
      </div>

      <!-- 多维筛选器 -->
      <div class="flex-1 overflow-y-auto px-6 pb-6">
        <ExploreFilters />
      </div>

      <!-- 清空筛选按钮 -->
      <div class="p-6 pt-0">
        <button
          v-if="Object.keys(gardenStore.filters).length > 0"
          @click="gardenStore.clearFilters()"
          class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200"
        >
          清空全部筛选
        </button>
      </div>
    </div>
  </aside>
</template>
