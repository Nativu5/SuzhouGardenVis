<!--
  左侧操作区组件
  - 概览模式：叙事场景选择器 + 场景筛选器容器
  - 探索模式：搜索框 + 多维筛选器容器
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore';
import { computed } from 'vue';
import NarrativeSelector from '@/components/overview/NarrativeSelector.vue';
import MetricCard from '@/components/overview/MetricCard.vue';
import ExploreFilters from '@/components/filters/ExploreFilters.vue';
import FilterTags from '@/components/filters/FilterTags.vue';

const gardenStore = useGardenStore();

// 判断是否为概览模式
const isOverviewMode = computed(() => gardenStore.viewMode === 'overview');

// 统计指标
const stats = computed(() => gardenStore.statistics);
</script>

<template>
  <aside class="flex w-80 flex-col overflow-hidden border-r border-gray-200 bg-white">
    <!-- 概览模式 -->
    <div v-if="isOverviewMode" class="flex flex-1 flex-col space-y-6 overflow-y-auto p-6">
      <!-- 叙事场景选择器 -->
      <NarrativeSelector />

      <!-- 整体统计指标 -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-700">整体概况</h3>
        <div class="grid grid-cols-2 gap-3">
          <MetricCard title="园林总数" :value="stats.totalCount" unit="座" />
          <MetricCard title="开放园林" :value="stats.openCount" unit="座" />
          <MetricCard title="开放率" :value="stats.openRate.toFixed(1)" unit="%" />
          <MetricCard title="世界遗产" :value="stats.worldHeritageCount" unit="座" />
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div class="flex items-start space-x-2.5">
          <svg
            class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1 space-y-1.5">
            <p class="text-xs leading-relaxed text-gray-700">
              点击右上角按钮可在<span class="font-medium text-blue-600">概览模式</span>和<span
                class="font-medium text-blue-600"
                >探索模式</span
              >之间切换
            </p>
            <p class="text-xs leading-relaxed text-gray-700">
              切换<span class="font-medium text-green-600">叙事场景</span
              >可从不同视角探索园林数据的深层洞察
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 探索模式 -->
    <div v-else class="flex flex-1 flex-col overflow-hidden">
      <div class="space-y-4 p-6">
        <!-- 搜索框 -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700"> 搜索园林 </label>
          <div class="relative">
            <input
              type="text"
              :value="gardenStore.filters.searchKeyword || ''"
              placeholder="输入园林名称..."
              class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              @input="
                gardenStore.updateFilters({
                  searchKeyword: ($event.target as HTMLInputElement).value,
                })
              "
            />
            <svg
              class="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
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
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">筛选结果</span>
            <span class="text-lg font-bold text-gray-900">
              {{ gardenStore.filteredData.length }}
            </span>
          </div>
          <div class="mt-1 text-xs text-gray-500">共 {{ gardenStore.rawData.length }} 条数据</div>
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
          class="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200"
          @click="gardenStore.clearFilters()"
        >
          清空全部筛选
        </button>
      </div>
    </div>
  </aside>
</template>
